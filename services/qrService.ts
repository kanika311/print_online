import QRCode from 'qrcode';

export async function generateShopQRCodeDataUrl(
  shopId: string,
  baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
): Promise<string> {
  const shopUrl = `${baseUrl}/shop/${shopId}`;

  try {
    const dataUrl = await QRCode.toDataURL(shopUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0a0e17', // Dark navy/black
        light: '#ffffff', // White background
      },
      errorCorrectionLevel: 'H',
    });
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    // Fallback URL generator using public QR service if library fails
    return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shopUrl)}`;
  }
}

export async function generateShopQRCodeSvg(
  shopId: string,
  baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
): Promise<string> {
  const shopUrl = `${baseUrl}/shop/${shopId}`;

  try {
    const svg = await QRCode.toString(shopUrl, {
      type: 'svg',
      width: 400,
      margin: 2,
      color: {
        dark: '#0284c7', // Brand cyan
        light: '#ffffff',
      },
    });
    return svg;
  } catch (error) {
    console.error('Error generating QR SVG:', error);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="10" y="50">QR Error</text></svg>`;
  }
}
