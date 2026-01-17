declare module 'react-qr-code' {
    import type { ComponentType, SVGAttributes } from 'react';

    export interface QRCodeProps extends SVGAttributes<SVGSVGElement> {
        value: string;
        size?: number;
        bgColor?: string;
        fgColor?: string;
        level?: 'L' | 'M' | 'Q' | 'H';
        includeMargin?: boolean;
    }

    const QRCode: ComponentType<QRCodeProps>;
    export default QRCode;
}
