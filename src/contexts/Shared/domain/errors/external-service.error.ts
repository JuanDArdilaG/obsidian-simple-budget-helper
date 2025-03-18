import { DomainError } from "./domain-error";

export class ExternalServiceError extends DomainError {
  constructor(serviceName: string, details: string) {
    super(`Error in external service '${serviceName}': ${details}`);
    this.serviceName = serviceName;
  }

  public readonly serviceName: string;

  public errorType(): string {
    return "EXTERNAL_SERVICE_FAILURE";
  }
}
