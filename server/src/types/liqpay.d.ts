declare module 'liqpay' {
  export default class LiqPay {
    constructor(public_key: string, private_key: string);
    
    api(path: string, params: Record<string, any>): Promise<any>;
    
    cnb_form(params: Record<string, any>): string;
    
    str_to_sign(str: string): string;
    
    verify_signature(data: string, signature: string): boolean;
  }
} 