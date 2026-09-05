import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore } from '@/lib/db';
import { authorize } from '@/lib/auth';
import { emitSocketEvent } from '@/lib/socketServer';
import { Printer } from '@/models/Printer';

// GET printer by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { isFallback } = await connectDB();
    const printerId = params.id;

    let printer = memoryStore.printers.find((p) => p._id === printerId);
    if (!printer && !isFallback) {
      try {
        printer = await Printer.findById(printerId).lean();
      } catch {}
    }

    if (!printer) {
      return NextResponse.json({ error: 'Printer not found' }, { status: 404 });
    }

    return NextResponse.json({ printer });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Edit printer settings or link/unlink hardware
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = authorize(req, ['ADMIN', 'SHOP_OWNER']);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { isFallback } = await connectDB();
    const printerId = params.id;
    const body = await req.json();

    const printerIdx = memoryStore.printers.findIndex((p) => p._id === printerId);
    if (printerIdx === -1) {
      return NextResponse.json({ error: 'Printer not found' }, { status: 404 });
    }

    const printer = memoryStore.printers[printerIdx];

    // Security check: if shop owner, must own the shop of this printer
    if (
      authResult.session?.role === 'SHOP_OWNER' &&
      authResult.session.shopId &&
      authResult.session.shopId !== printer.shopId
    ) {
      return NextResponse.json({ error: 'Unauthorized to modify this printer' }, { status: 403 });
    }

    if (body.name !== undefined) printer.name = body.name;
    if (body.model !== undefined) printer.model = body.model;
    if (body.type !== undefined) printer.type = body.type;
    if (body.ppmSpeed !== undefined) printer.ppmSpeed = Number(body.ppmSpeed);
    if (body.paperSizes !== undefined) printer.paperSizes = body.paperSizes;
    if (body.supportsDuplex !== undefined) printer.supportsDuplex = Boolean(body.supportsDuplex);
    if (body.connectionType !== undefined) printer.connectionType = body.connectionType;
    if (body.ipAddress !== undefined) printer.ipAddress = body.ipAddress;
    if (body.portNumber !== undefined) printer.portNumber = Number(body.portNumber);
    if (body.usbPort !== undefined) printer.usbPort = body.usbPort;
    if (body.isLinked !== undefined) printer.isLinked = Boolean(body.isLinked);
    if (body.notes !== undefined) printer.notes = body.notes;
    printer.updatedAt = new Date();

    if (!isFallback) {
      try {
        await Printer.findByIdAndUpdate(printerId, printer);
      } catch (err) {
        console.warn('DB update error for printer:', err);
      }
    }

    emitSocketEvent('printer:status_updated', printer, `shop:${printer.shopId}`);

    return NextResponse.json({
      success: true,
      message: 'Printer machine updated successfully',
      printer,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Delete a printer machine from the fleet
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = authorize(req, ['ADMIN', 'SHOP_OWNER']);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { isFallback } = await connectDB();
    const printerId = params.id;

    const printerIdx = memoryStore.printers.findIndex((p) => p._id === printerId);
    if (printerIdx === -1) {
      return NextResponse.json({ error: 'Printer not found' }, { status: 404 });
    }

    const printer = memoryStore.printers[printerIdx];

    if (
      authResult.session?.role === 'SHOP_OWNER' &&
      authResult.session.shopId &&
      authResult.session.shopId !== printer.shopId
    ) {
      return NextResponse.json({ error: 'Unauthorized to delete this printer' }, { status: 403 });
    }

    memoryStore.printers.splice(printerIdx, 1);

    if (!isFallback) {
      try {
        await Printer.findByIdAndDelete(printerId);
      } catch (err) {
        console.warn('DB delete error for printer:', err);
      }
    }

    emitSocketEvent('printer:deleted', { printerId }, `shop:${printer.shopId}`);

    return NextResponse.json({
      success: true,
      message: 'Printer removed from fleet',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
