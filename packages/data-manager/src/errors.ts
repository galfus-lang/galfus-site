import type * as v from 'valibot';
import { isErrorMessageId, type ErrorMessageId } from '@galfus/i18n';

export interface ValidationError {
  code: 'validation_error';
  id: ErrorMessageId;
  issues: v.BaseIssue<unknown>[];
}

export interface ConflictError {
  code: 'conflict';
  id: 'error.auth.identity.already_exists';
  resource: 'account_identity';
}

export interface AuthenticationError {
  code: 'authentication_error';
  id: ErrorMessageId;
}

export type DataManagerError = ValidationError | ConflictError | AuthenticationError;

export type DataManagerResult<T> =
  | { success: true; data: T }
  | { success: false; error: DataManagerError };

export function invalidInput(issues: v.BaseIssue<unknown>[]): DataManagerResult<never> {
  return {
    success: false,
    error: {
      code: 'validation_error',
      id: messageIdFromIssues(issues),
      issues,
    },
  };
}

export function conflict(resource: ConflictError['resource']): DataManagerResult<never> {
  return { success: false, error: { code: 'conflict', id: 'error.auth.identity.already_exists', resource } };
}

export function authenticationError(id: ErrorMessageId): DataManagerResult<never> {
  return { success: false, error: { code: 'authentication_error', id } };
}

export function messageIdFromIssues(issues: v.BaseIssue<unknown>[]): ErrorMessageId {
  const message = issues[0]?.message;
  return isErrorMessageId(message) ? message : 'error.input.invalid';
}
