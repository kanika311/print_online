import { PrintSpecs } from '../db/types';

export interface PriceBreakdown {
  pageCount: number;
  copies: number;
  totalPagesToPrint: number;
  baseRatePerPage: number;
  paperTypeSurcharge: number;
  effectiveRatePerPage: number;
  printCost: number;
  bindingCost: number;
  platformFee: number;
  deliveryFee: number;
  subtotal: number;
  taxGst: number;
  totalPrice: number;
  shopEarnings: number;
}

export class PricingEngine {
  // Base rates per page
  private static readonly BASE_RATES: Record<string, Record<string, number>> = {
    A4: { BW: 2.0, COLOR: 10.0 },
    A3: { BW: 5.0, COLOR: 25.0 },
    Legal: { BW: 3.0, COLOR: 12.0 },
    Letter: { BW: 2.0, COLOR: 10.0 },
  };

  // Paper type multiplier / surcharge per page
  private static readonly PAPER_SURCHARGES: Record<string, number> = {
    'Normal 75gsm': 0.0,
    'Bond paper 85gsm': 1.5,
    'Glossy 180gsm': 8.0,
    'Cardstock 250gsm': 15.0,
  };

  // Binding flat prices
  private static readonly BINDING_PRICES: Record<string, number> = {
    'None': 0,
    'Corner Staple': 5.0,
    'Spiral Ring Binding': 35.0,
  };

  public static calculate(
    specs: PrintSpecs,
    pageCount: number,
    deliveryType: 'SELF_PICKUP' | 'HOME_DELIVERY',
    distanceKm: number = 2.5
  ): PriceBreakdown {
    const sizeRates = this.BASE_RATES[specs.paperSize] || this.BASE_RATES['A4'];
    const baseRate = sizeRates[specs.printType] || 2.0;
    const paperSurcharge = this.PAPER_SURCHARGES[specs.paperType] || 0;

    let effectiveRate = baseRate + paperSurcharge;
    // Duplex gives a 10% discount on print cost per sheet
    if (specs.duplex) {
      effectiveRate = parseFloat((effectiveRate * 0.9).toFixed(2));
    }

    const totalPagesToPrint = pageCount * specs.copies;
    const printCost = parseFloat((totalPagesToPrint * effectiveRate).toFixed(2));
    const bindingCost = (this.BINDING_PRICES[specs.binding] || 0) * specs.copies;

    const platformFee = 5.0; // Standard 5 INR platform maintenance fee

    let deliveryFee = 0;
    if (deliveryType === 'HOME_DELIVERY') {
      const baseFee = 25.0; // Covers up to 2km
      const extraKm = Math.max(0, distanceKm - 2);
      deliveryFee = parseFloat((baseFee + extraKm * 8.0).toFixed(2));
    }

    const subtotal = parseFloat((printCost + bindingCost + platformFee + deliveryFee).toFixed(2));
    const taxGst = parseFloat((subtotal * 0.05).toFixed(2)); // 5% GST on print services
    const totalPrice = Math.round(subtotal + taxGst);

    // Platform commission: 10% of print+binding + flat platform fee
    const platformCommission = parseFloat(((printCost + bindingCost) * 0.10 + platformFee).toFixed(2));
    const shopEarnings = parseFloat((totalPrice - platformCommission - deliveryFee).toFixed(2));

    return {
      pageCount,
      copies: specs.copies,
      totalPagesToPrint,
      baseRatePerPage: baseRate,
      paperTypeSurcharge: paperSurcharge,
      effectiveRatePerPage: effectiveRate,
      printCost,
      bindingCost,
      platformFee,
      deliveryFee,
      subtotal,
      taxGst,
      totalPrice,
      shopEarnings: Math.max(0, shopEarnings),
    };
  }
}
