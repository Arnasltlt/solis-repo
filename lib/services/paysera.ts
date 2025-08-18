import crypto from 'crypto';

export interface PayseraConfig {
	projectId: string;
	signPassword: string;
	businessId: string;
	macId: string;
	macKey: string;
	macAlgorithm: string;
	test: boolean;
}

export interface CreatePaymentParams {
	amount: number;
	currency: string;
	orderId: string;
	userId: string;
	returnUrl: string;
	cancelUrl: string;
	callbackUrl: string;
	email?: string;
	description?: string;
	isRecurring?: boolean;
	refundOnCapture?: boolean;
}

export interface PayseraPaymentResponse {
	status: string;
	payment_url: string;
	orderId: string;
	paymentRequestId?: string;
}

export interface AuthorizeRecurringPaymentParams {
	paymentRequestId: string;
	token: string;
}

export interface CapturePaymentParams {
	paymentRequestId: string;
}

export interface PayseraNotification {
	id: string;
	status: string;
	data: {
		id: string;
		status: string;
		order_id: string;
		token?: string;
		[key: string]: any;
	};
}

export class PayseraService {
	private config: PayseraConfig;
	private baseUrl: string;
	private apiBaseUrl: string;

	constructor(config: PayseraConfig) {
		this.config = config;
		this.baseUrl = config.test 
			? 'https://sandbox.paysera.com/pay/'
			: 'https://www.paysera.com/pay/';
		this.apiBaseUrl = config.test
			? 'https://checkout-eu-a.paysera.com'
			: 'https://checkout-eu-a.paysera.com';
	}

	private generateSignature(params: Record<string, string>): string {
		const orderedParams = Object.keys(params)
			.sort()
			.reduce((acc, key) => {
				acc[key] = params[key];
				return acc;
			}, {} as Record<string, string>);

		const encodedString = Object.entries(orderedParams)
			.map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
			.join('&');

		return crypto
			.createHash('md5')
			.update(encodedString + this.config.signPassword)
			.digest('hex');
	}

	private generateMacAuthHeader(url: string, method: string, body?: string): string {
		const timestamp = Math.floor(Date.now() / 1000).toString();
		const nonce = crypto.randomBytes(16).toString('hex');
		
		// Normalize request parts
		const normalizedUrl = new URL(url).pathname;
		const normalizedMethod = method.toUpperCase();
		const normalizedHost = new URL(url).host;
		const normalizedPort = '';
		
		// Create normalized request string
		let normalizedRequest = `${timestamp}\n${nonce}\n${normalizedMethod}\n${normalizedUrl}\n${normalizedHost}\n${normalizedPort}\n\n`;
		
		// Add body hash if present
		if (body) {
			const bodyHash = crypto.createHash('sha256').update(body).digest('base64');
			normalizedRequest += bodyHash + '\n';
		}
		
		// Generate MAC
		const mac = crypto
			.createHmac('sha256', this.config.macKey)
			.update(normalizedRequest)
			.digest('base64');
		
		// Return authorization header
		return `MAC id="${this.config.macId}", ts="${timestamp}", nonce="${nonce}", mac="${mac}"`;
	}

	async createPayment(params: CreatePaymentParams): Promise<PayseraPaymentResponse> {
		if (params.isRecurring) {
			return this.createRecurringPayment(params);
		}

		// Legacy implementation for standard payments
		const paymentParams = {
			projectid: this.config.projectId,
			orderid: params.orderId,
			amount: (params.amount * 100).toString(), // Convert to cents
			currency: params.currency,
			country: 'LT',
			accepturl: params.returnUrl,
			cancelurl: params.cancelUrl,
			callbackurl: params.callbackUrl,
			test: this.config.test ? '1' : '0',
			version: '1.6',
		};

		const sign = this.generateSignature(paymentParams);
		const finalParams = {
			...paymentParams,
			sign: sign,
		};

		const searchParams = new URLSearchParams(finalParams);
		const paymentUrl = `${this.baseUrl}?${searchParams.toString()}`;

		return {
			status: 'created',
			payment_url: paymentUrl,
			orderId: params.orderId,
		};
	}

	async createRecurringPayment(params: CreatePaymentParams): Promise<PayseraPaymentResponse> {
		const url = `${this.apiBaseUrl}/checkout/rest/v1/payment-requests`;
		
		const paymentRequest = {
			business_id: this.config.businessId,
			order_id: params.orderId,
			price: {
				amount: params.amount.toFixed(2),
				currency: params.currency,
			},
			method_key: "card",
			payer: {
				email: params.email || "",
				description: params.description || `Payment for order ${params.orderId}`,
			},
			locale: "lt",
			accept_url: params.returnUrl,
			cancel_url: params.cancelUrl,
			callback_url: params.callbackUrl,
			token_strategy: "required", // Always require token for recurring billing
		};

		// Add refund_on_capture if needed (for token without actual payment)
		if (params.refundOnCapture) {
			Object.assign(paymentRequest, { refund_on_capture: true });
		}
		
		const body = JSON.stringify(paymentRequest);
		const authHeader = this.generateMacAuthHeader(url, 'POST', body);
		
		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json;charset=utf-8',
					'Authorization': authHeader,
				},
				body,
			});
			
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Failed to create payment request: ${response.status} ${response.statusText} - ${errorText}`);
			}
			
			const data = await response.json();
			
			if (!data.id || !data.authorization_url) {
				throw new Error('Invalid response from Paysera API: missing id or authorization_url');
			}
			
			return {
				status: data.status,
				payment_url: data.authorization_url,
				orderId: params.orderId,
				paymentRequestId: data.id,
			};
		} catch (error) {
			console.error('Error creating recurring payment:', error);
			throw error;
		}
	}

	async authorizeRecurringPayment(params: AuthorizeRecurringPaymentParams): Promise<{ status: string }> {
		if (!params.paymentRequestId || !params.token) {
			throw new Error('Payment request ID and token are required for authorization');
		}
		
		const url = `${this.apiBaseUrl}/checkout/rest/v1/payment-requests/${params.paymentRequestId}/authorize`;
		
		const body = JSON.stringify({
			token: params.token,
		});
		
		const authHeader = this.generateMacAuthHeader(url, 'PUT', body);
		
		try {
			const response = await fetch(url, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json;charset=utf-8',
					'Authorization': authHeader,
				},
				body,
			});
			
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Failed to authorize payment: ${response.status} ${response.statusText} - ${errorText}`);
			}
			
			const data = await response.json();
			
			if (!data.status) {
				throw new Error('Invalid response from Paysera API: missing status');
			}
			
			return { status: data.status };
		} catch (error) {
			console.error('Error authorizing recurring payment:', error);
			throw error;
		}
	}

	async capturePayment(params: CapturePaymentParams): Promise<{ status: string }> {
		if (!params.paymentRequestId) {
			throw new Error('Payment request ID is required for capture');
		}
		
		const url = `${this.apiBaseUrl}/checkout/rest/v1/payment-requests/${params.paymentRequestId}/capture`;
		const authHeader = this.generateMacAuthHeader(url, 'PUT');
		
		try {
			const response = await fetch(url, {
				method: 'PUT',
				headers: {
					'Authorization': authHeader,
				},
			});
			
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Failed to capture payment: ${response.status} ${response.statusText} - ${errorText}`);
			}
			
			const data = await response.json();
			
			if (!data.status) {
				throw new Error('Invalid response from Paysera API: missing status');
			}
			
			return { status: data.status };
		} catch (error) {
			console.error('Error capturing payment:', error);
			throw error;
		}
	}

	async getNotification(notificationId: string): Promise<PayseraNotification> {
		if (!notificationId) {
			throw new Error('Notification ID is required');
		}
		
		const url = `${this.apiBaseUrl}/notification/rest/v1/notifications/${notificationId}`;
		const authHeader = this.generateMacAuthHeader(url, 'GET');
		
		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					'Authorization': authHeader,
				},
			});
			
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Failed to get notification: ${response.status} ${response.statusText} - ${errorText}`);
			}
			
			const data = await response.json();
			
			if (!data.id || !data.data) {
				throw new Error('Invalid notification data received from Paysera API');
			}
			
			return data as PayseraNotification;
		} catch (error) {
			console.error('Error getting notification:', error);
			throw error;
		}
	}

	async markNotificationAsRead(notificationId: string): Promise<void> {
		if (!notificationId) {
			throw new Error('Notification ID is required');
		}
		
		const url = `${this.apiBaseUrl}/notification/rest/v1/notifications/${notificationId}/read`;
		const authHeader = this.generateMacAuthHeader(url, 'PUT');
		
		try {
			const response = await fetch(url, {
				method: 'PUT',
				headers: {
					'Authorization': authHeader,
				},
			});
			
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Failed to mark notification as read: ${response.status} ${response.statusText} - ${errorText}`);
			}
		} catch (error) {
			console.error('Error marking notification as read:', error);
			throw error;
		}
	}

	verifyWebhook(data: any, signature: string): boolean {
		if (!data || !signature) {
			return false;
		}
		
		try {
			const receivedSign = signature;
			const calculatedSign = this.generateSignature(data);
			return receivedSign === calculatedSign;
		} catch (error) {
			console.error('Error verifying webhook signature:', error);
			return false;
		}
	}

	parsePaymentResponse(data: any): {
		status: 'ok' | 'error';
		orderId: string;
		paymentId?: string;
		token?: string;
		error?: string;
	} {
		if (!data) {
			return {
				status: 'error',
				orderId: '',
				error: 'No data provided',
			};
		}
		
		if (!this.verifyWebhook(data, data.sign)) {
			return {
				status: 'error',
				orderId: data.orderid || '',
				error: 'Invalid signature',
			};
		}

		return {
			status: data.status === '1' ? 'ok' : 'error',
			orderId: data.orderid,
			paymentId: data.requestid,
			token: data.token,
			error: data.status !== '1' ? 'Payment failed' : undefined,
		};
	}
	
	// Helper method to create a payment request for token generation without actual payment
	async createTokenOnlyPayment(params: CreatePaymentParams): Promise<PayseraPaymentResponse> {
		return this.createRecurringPayment({
			...params,
			isRecurring: true,
			refundOnCapture: true
		});
	}
}

export const payseraService = new PayseraService({
	projectId: process.env.PAYSERA_PROJECT_ID || '',
	signPassword: process.env.PAYSERA_SIGN_PASSWORD || '',
	businessId: process.env.PAYSERA_BUSINESS_ID || '',
	macId: process.env.PAYSERA_MAC_ID || '',
	macKey: process.env.PAYSERA_MAC_KEY || '',
	macAlgorithm: process.env.PAYSERA_MAC_ALGORITHM || 'hmac-sha-256',
	test: process.env.NODE_ENV !== 'production',
});

