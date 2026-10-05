import QRCode from 'qrcode';

/** Renders a provisioning URI as inline SVG; it must not be cached or logged. */
export function createQrCodeSvg(value: string): Promise<string> {
  if (!value) throw new Error('A QR code value is required.');

  return QRCode.toString(value, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  });
}
