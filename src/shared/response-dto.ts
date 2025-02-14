export class Response<T> {
    data?: T;
    message: string;
    code: number;
    error: string | null;

    constructor(data: T, message: string, statusCode: number, error: string | null = null) {
        this.data = data;
        this.message = message;
        this.code = statusCode;
        this.error = error;
    }
}

export class SuccessResponse<T> extends Response<T> {
    constructor(data: T, message: string = 'ok') {
        super(data, message, 0);
    }
}

export class FailResponse<T> extends Response<T> {
    constructor(message: string,error: string | null) {
        super(null, message, 1, error);
    }
}
