export interface PricingInput {
  pageCount: number;
  copies: number;
  isColor: boolean;
  isDuplex: boolean;
  paperSize: string; // 'A4' | 'A3' | 'Legal' | 'Letter'
  orientation?: 'PORTRAIT' | 'LANDSCAPE';
  binding: string; // 'None' | 'Corner Staple' | 'Spiral Binding'
  fulfillmentType?: 'PICKUP' | 'DELIVERY';
  deliveryFee?: number;
  shopRates?: {
    bwSingle?: number;
    bwDuplex?: number;
    colorSingle?: number;
    colorDuplex?: number;
    a3Surcharge?: number;
    spiralBinding?: number;
    stapleBinding?: number;
  };
}

export interface PricingBreakdown {
  pagesTotal: number;
  ratePerPage: number;
  printingSubtotal: number;
  bindingFee: number;
  paperSurcharge: number;
  deliveryFee: number;
  gstAmount: number;
  totalPrice: number;
}

export function calculatePrintPrice(input: PricingInput): PricingBreakdown {
  const {
    pageCount,
    copies,
    isColor,
    isDuplex,
    paperSize,
    binding,
    fulfillmentType = 'PICKUP',
    deliveryFee: customDeliveryFee,
    shopRates = {},
  } = input;

  const bwSingle = shopRates.bwSingle ?? 2.0;
  const bwDuplex = shopRates.bwDuplex ?? 3.5;
  const colorSingle = shopRates.colorSingle ?? 10.0;
  const colorDuplex = shopRates.colorDuplex ?? 18.0;
  const a3Rate = shopRates.a3Surcharge ?? 5.0;
  const spiralRate = shopRates.spiralBinding ?? 35.0;
  const stapleRate = shopRates.stapleBinding ?? 5.0;

  // Total sheets across all copies
  const totalSheets = Math.max(1, pageCount) * Math.max(1, copies);

  // Rate per page
  let ratePerPage = 2.0;
  if (isColor) {
    ratePerPage = isDuplex ? colorDuplex / 2 : colorSingle;
  } else {
    ratePerPage = isDuplex ? bwDuplex / 2 : bwSingle;
  }

  const printingSubtotal = +(totalSheets * ratePerPage).toFixed(2);

  // Paper surcharge (A3 is double standard leaf)
  let paperSurcharge = 0;
  if (paperSize.toUpperCase() === 'A3') {
    paperSurcharge = totalSheets * a3Rate;
  } else if (paperSize.toUpperCase() === 'LEGAL') {
    paperSurcharge = totalSheets * 1.0;
  }

  // Binding fee
  let bindingFee = 0;
  if (binding.toLowerCase().includes('spiral')) {
    bindingFee = copies * spiralRate;
  } else if (binding.toLowerCase().includes('staple')) {
    bindingFee = copies * stapleRate;
  }

  // Delivery fee (Porter / Third-party courier)
  const deliveryFee = fulfillmentType === 'DELIVERY' ? (customDeliveryFee ?? 40.0) : 0.0;

  const subtotalBeforeTax = printingSubtotal + paperSurcharge + bindingFee;
  // 5% GST on print services
  const gstAmount = +(subtotalBeforeTax * 0.05).toFixed(2);
  const totalPrice = Math.round((subtotalBeforeTax + gstAmount + deliveryFee) * 100) / 100;

  return {
    pagesTotal: totalSheets,
    ratePerPage,
    printingSubtotal,
    bindingFee,
    paperSurcharge,
    deliveryFee,
    gstAmount,
    totalPrice: Math.max(totalPrice, 2.0),
  };
}
