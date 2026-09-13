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
      if (!printer) {
        try {
          printer = await Printer.findOne({ _id: printerId }).lean();
        } catch {}
      }
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

    let memPrinter = memoryStore.printers.find((p) => p._id === printerId);
    let dbPrinter: any = null;

    if (!isFallback) {
      try {
        dbPrinter = await Printer.findById(printerId);
      } catch {}
      if (!dbPrinter) {
        try {
          dbPrinter = await Printer.findOne({ _id: printerId });
        } catch {}
      }
    }

    if (!memPrinter && !dbPrinter) {
      return NextResponse.json({ error: 'Printer not found' }, { status: 404 });
    }

    const targetShopId = memPrinter?.shopId || dbPrinter?.shopId;

    // Security check: if shop owner, must own the shop of this printer
    if (
      authResult.session?.role === 'SHOP_OWNER' &&
      authResult.session.shopId &&
      authResult.session.shopId !== targetShopId
    ) {
      return NextResponse.json({ error: 'Unauthorized to modify this printer' }, { status: 403 });
    }

    const portNum = body.portNumber !== undefined 
      ? Number(body.portNumber) 
      : (body.port !== undefined ? Number(body.port) : undefined);

    const now = new Date();

    if (memPrinter) {
      if (body.name !== undefined) memPrinter.name = body.name;
      if (body.model !== undefined) memPrinter.model = body.model;
      if (body.type !== undefined) memPrinter.type = body.type;
      if (body.ppmSpeed !== undefined) memPrinter.ppmSpeed = Number(body.ppmSpeed);
      if (body.paperSizes !== undefined) memPrinter.paperSizes = body.paperSizes;
      if (body.supportsDuplex !== undefined) memPrinter.supportsDuplex = Boolean(body.supportsDuplex);
      if (body.connectionType !== undefined) memPrinter.connectionType = body.connectionType;
      if (body.ipAddress !== undefined) memPrinter.ipAddress = body.ipAddress;
      if (portNum !== undefined) memPrinter.portNumber = portNum;
      if (body.usbPort !== undefined) memPrinter.usbPort = body.usbPort;
      if (body.isLinked !== undefined) memPrinter.isLinked = Boolean(body.isLinked);
      if (body.notes !== undefined) memPrinter.notes = body.notes;
      memPrinter.updatedAt = now;
    }

    if (dbPrinter) {
      if (body.name !== undefined) dbPrinter.name = body.name;
      if (body.model !== undefined) dbPrinter.model = body.model;
      if (body.type !== undefined) dbPrinter.type = body.type;
      if (body.ppmSpeed !== undefined) dbPrinter.ppmSpeed = Number(body.ppmSpeed);
      if (body.paperSizes !== undefined) dbPrinter.paperSizes = body.paperSizes;
      if (body.supportsDuplex !== undefined) dbPrinter.supportsDuplex = Boolean(body.supportsDuplex);
      if (body.connectionType !== undefined) dbPrinter.connectionType = body.connectionType;
      if (body.ipAddress !== undefined) dbPrinter.ipAddress = body.ipAddress;
      if (portNum !== undefined) dbPrinter.portNumber = portNum;
      if (body.usbPort !== undefined) dbPrinter.usbPort = body.usbPort;
      if (body.isLinked !== undefined) dbPrinter.isLinked = Boolean(body.isLinked);
      if (body.notes !== undefined) dbPrinter.notes = body.notes;
      dbPrinter.updatedAt = now;
      try {
        await dbPrinter.save();
      } catch (err) {
        console.warn('DB update error for printer:', err);
      }
    }

    const updatedPrinter = memPrinter || (dbPrinter?.toObject ? dbPrinter.toObject() : dbPrinter);

    emitSocketEvent('printer:status_updated', updatedPrinter, `shop:${targetShopId}`);

    return NextResponse.json({
      success: true,
      message: 'Printer machine updated successfully',
      printer: updatedPrinter,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Support both PUT and PATCH for updating printer details
export const PUT = PATCH;

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

    let printerIdx = memoryStore.printers.findIndex((p) => p._id === printerId);
    let memPrinter = printerIdx !== -1 ? memoryStore.printers[printerIdx] : null;
    let dbPrinter: any = null;

    if (!isFallback) {
      try {
        dbPrinter = await Printer.findById(printerId);
      } catch {}
      if (!dbPrinter) {
        try {
          dbPrinter = await Printer.findOne({ _id: printerId });
        } catch {}
      }
    }

    if (!memPrinter && !dbPrinter) {
      return NextResponse.json({ error: 'Printer not found' }, { status: 404 });
    }

    const targetShopId = memPrinter?.shopId || dbPrinter?.shopId;

    if (
      authResult.session?.role === 'SHOP_OWNER' &&
      authResult.session.shopId &&
      authResult.session.shopId !== targetShopId
    ) {
      return NextResponse.json({ error: 'Unauthorized to delete this printer' }, { status: 403 });
    }

    if (printerIdx !== -1) {
      memoryStore.printers.splice(printerIdx, 1);
    }

    if (!isFallback) {
      try {
        await Printer.deleteMany({ _id: printerId });
      } catch (err) {
        console.warn('DB delete error for printer:', err);
      }
    }

    emitSocketEvent('printer:deleted', { printerId }, `shop:${targetShopId}`);

    return NextResponse.json({
      success: true,
      message: 'Printer removed from fleet',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
