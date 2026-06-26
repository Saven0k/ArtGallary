import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { ValidationException } from "../exceptions/validation.exception";

@Injectable()
export class ValidationPipe implements PipeTransform {
    async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
        if (!metadata.metatype) {
            return value;
        }
        const obj = plainToClass(metadata.metatype, value);
        const errors = await validate(obj)

        if (errors.length) {
            let messages = errors.map(err => {
                if (err.constraints) {
                    return `${err.property} - ${Object.values(err.constraints).join(', ')}`;
                }
                return `${err.property} - Validation error`;
            });
            throw new ValidationException(messages);
        }

        return value; 
    }
}