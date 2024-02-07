import { Injectable, ErrorHandler } from '@angular/core';
import { CommonError } from './common-error';
import { throwError } from 'rxjs';

export class CommonErrorHandlerService implements ErrorHandler {
  constructor() { }

  handleError(error: any) {
    let customError: CommonError = {
      code: 502,
      statusText: (<Error>error).message,
      messages: [(<Error>error).message],
      friendlyMessage: 'An error occurred. Please try again.'
    };
    return throwError(customError)
  }
}
