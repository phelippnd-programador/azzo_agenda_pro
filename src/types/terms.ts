export type TermsDocumentType = "TERMS_OF_USE" | "PRIVACY_POLICY" | string;

export type LegalDocumentResponse = {
  documentType: string;
  version: string;
  title: string;
  content: string;
  contentHash: string;
  createdAt: string;
};

export type PublicLegalResponse = {
  termsOfUse: LegalDocumentResponse | null;
  privacyPolicy: LegalDocumentResponse | null;
};
