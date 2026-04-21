import type { ComponentType, ReactNode } from "react";
import { Navigate, Route } from "react-router-dom";
import { appRouteManifest } from "@/app/route-manifest";
import {
  AbandonmentReport,
  Agenda,
  AppointmentManagementReport,
  ApuracaoMensal,
  Auditoria,
  ChatPage,
  ClientImportDetailPage,
  ClientImportsPage,
  ClientProfile,
  Clients,
  ClientsOverviewPage,
  Financial,
  FinancialCommissions,
  FiscalCertificatesSettings,
  Index,
  InvoiceEmission,
  InvoicePreview,
  LicensePage,
  LgpdRequests,
  NfseInvoiceDetails,
  NfseInvoiceForm,
  NfseInvoicePdf,
  NfseInvoices,
  NfseSettings,
  NoShowReport,
  Notifications,
  ProfessionalCommissionReport,
  ProfessionalCommissionSettings,
  ProfessionalFinancial,
  ProfessionalProfile,
  Professionals,
  SalonProfile,
  ServiceImportDetailPage,
  ServiceImportsPage,
  Services,
  ServicesOverviewPage,
  Settings,
  SpecialtyImportDetailPage,
  SpecialtyImportsPage,
  Specialties,
  SpecialtiesOverviewPage,
  Stock,
  StockImportDetailPage,
  StockImportsPage,
  StockInventoriesPage,
  StockItemsPage,
  StockMovementsPage,
  StockOverview,
  StockPurchaseOrdersPage,
  StockSettingsPage,
  StockSuppliersPage,
  StockTransfersPage,
  SuggestionsPage,
  SystemAdminPage,
  TaxConfig,
  Unauthorized,
  UserProfile,
  WhatsAppIntegration,
} from "@/app/routes/lazy-pages";

type RouteWrapperProps = {
  children: ReactNode;
};

type ProtectedRouteGroupProps = {
  ProtectedRoute: ComponentType<RouteWrapperProps>;
};

export function ProtectedRouteGroup({
  ProtectedRoute,
}: ProtectedRouteGroupProps) {
  return (
    <>
      <Route path={appRouteManifest.shell.dashboard} element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path={appRouteManifest.shell.notifications} element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path={appRouteManifest.shell.agenda} element={<ProtectedRoute><Agenda /></ProtectedRoute>} />

      <Route path={appRouteManifest.reports.root} element={<ProtectedRoute><Navigate to={appRouteManifest.reports.appointments} replace /></ProtectedRoute>} />
      <Route path={appRouteManifest.reports.appointments} element={<ProtectedRoute><AppointmentManagementReport /></ProtectedRoute>} />
      <Route path={appRouteManifest.reports.noShow} element={<ProtectedRoute><NoShowReport /></ProtectedRoute>} />
      <Route path={appRouteManifest.reports.abandonment} element={<ProtectedRoute><AbandonmentReport /></ProtectedRoute>} />
      <Route path={appRouteManifest.reports.legacyRoot} element={<ProtectedRoute><Navigate to={appRouteManifest.reports.appointments} replace /></ProtectedRoute>} />
      <Route path={appRouteManifest.reports.legacyAppointments} element={<ProtectedRoute><Navigate to={appRouteManifest.reports.appointments} replace /></ProtectedRoute>} />
      <Route path={appRouteManifest.reports.legacyAppointmentsPlural} element={<ProtectedRoute><Navigate to={appRouteManifest.reports.appointments} replace /></ProtectedRoute>} />
      <Route path={appRouteManifest.reports.legacyNoShow} element={<ProtectedRoute><Navigate to={appRouteManifest.reports.noShow} replace /></ProtectedRoute>} />
      <Route path={appRouteManifest.reports.legacyAbandonment} element={<ProtectedRoute><Navigate to={appRouteManifest.reports.abandonment} replace /></ProtectedRoute>} />
      <Route path={appRouteManifest.reports.agendaNoShow} element={<ProtectedRoute><Navigate to={appRouteManifest.reports.noShow} replace /></ProtectedRoute>} />
      <Route path={appRouteManifest.reports.agendaNoShowWildcard} element={<ProtectedRoute><Navigate to={appRouteManifest.reports.noShow} replace /></ProtectedRoute>} />

      <Route path={appRouteManifest.services.root} element={<ProtectedRoute><Services /></ProtectedRoute>}>
        <Route index element={<ServicesOverviewPage />} />
        <Route path={appRouteManifest.services.imports} element={<ServiceImportsPage />} />
        <Route path={appRouteManifest.services.importDetail} element={<ServiceImportDetailPage />} />
      </Route>

      <Route path={appRouteManifest.specialties.root} element={<ProtectedRoute><Specialties /></ProtectedRoute>}>
        <Route index element={<SpecialtiesOverviewPage />} />
        <Route path={appRouteManifest.specialties.imports} element={<SpecialtyImportsPage />} />
        <Route path={appRouteManifest.specialties.importDetail} element={<SpecialtyImportDetailPage />} />
      </Route>

      <Route path={appRouteManifest.professionals.root} element={<ProtectedRoute><Professionals /></ProtectedRoute>} />
      <Route path={appRouteManifest.professionals.profile} element={<ProtectedRoute><ProfessionalProfile /></ProtectedRoute>} />
      <Route path={appRouteManifest.professionals.commission} element={<ProtectedRoute><ProfessionalCommissionSettings /></ProtectedRoute>} />

      <Route path={appRouteManifest.clients.root} element={<ProtectedRoute><Clients /></ProtectedRoute>}>
        <Route index element={<ClientsOverviewPage />} />
        <Route path={appRouteManifest.clients.imports} element={<ClientImportsPage />} />
        <Route path={appRouteManifest.clients.importDetail} element={<ClientImportDetailPage />} />
      </Route>
      <Route path={appRouteManifest.clients.profile} element={<ProtectedRoute><ClientProfile /></ProtectedRoute>} />
      <Route path={appRouteManifest.shell.suggestions} element={<ProtectedRoute><SuggestionsPage /></ProtectedRoute>} />
      <Route path={appRouteManifest.chat.root} element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path={appRouteManifest.chat.conversation} element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

      <Route path={appRouteManifest.stock.root} element={<ProtectedRoute><Stock /></ProtectedRoute>}>
        <Route index element={<StockOverview />} />
        <Route path={appRouteManifest.stock.overview} element={<StockOverview />} />
        <Route path={appRouteManifest.stock.items} element={<StockItemsPage />} />
        <Route path={appRouteManifest.stock.itemCreate} element={<StockItemsPage />} />
        <Route path={appRouteManifest.stock.itemEdit} element={<StockItemsPage />} />
        <Route path={appRouteManifest.stock.movements} element={<StockMovementsPage />} />
        <Route path={appRouteManifest.stock.movementCreate} element={<StockMovementsPage />} />
        <Route path={appRouteManifest.stock.imports} element={<StockImportsPage />} />
        <Route path={appRouteManifest.stock.importDetail} element={<StockImportDetailPage />} />
        <Route path={appRouteManifest.stock.inventories} element={<StockInventoriesPage />} />
        <Route path={appRouteManifest.stock.inventoryCreate} element={<StockInventoriesPage />} />
        <Route path={appRouteManifest.stock.inventoryDetail} element={<StockInventoriesPage />} />
        <Route path={appRouteManifest.stock.suppliers} element={<StockSuppliersPage />} />
        <Route path={appRouteManifest.stock.purchaseOrders} element={<StockPurchaseOrdersPage />} />
        <Route path={appRouteManifest.stock.purchaseOrderDetail} element={<StockPurchaseOrdersPage />} />
        <Route path={appRouteManifest.stock.transfers} element={<StockTransfersPage />} />
        <Route path={appRouteManifest.stock.settingsAlias} element={<Navigate to={appRouteManifest.settings.stock} replace />} />
      </Route>

      <Route path={appRouteManifest.finance.root} element={<ProtectedRoute><Financial /></ProtectedRoute>} />
      <Route path={appRouteManifest.finance.commissions} element={<ProtectedRoute><FinancialCommissions /></ProtectedRoute>} />
      <Route path={appRouteManifest.finance.professionalCommission} element={<ProtectedRoute><ProfessionalCommissionReport /></ProtectedRoute>} />
      <Route path={appRouteManifest.finance.professionals} element={<ProtectedRoute><ProfessionalFinancial /></ProtectedRoute>} />
      <Route path={appRouteManifest.finance.license} element={<ProtectedRoute><LicensePage /></ProtectedRoute>} />

      <Route path={appRouteManifest.audit.root} element={<ProtectedRoute><Auditoria /></ProtectedRoute>} />
      <Route path={appRouteManifest.audit.lgpd} element={<ProtectedRoute><LgpdRequests /></ProtectedRoute>} />

      <Route path={appRouteManifest.settings.root} element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path={appRouteManifest.settings.stock} element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path={appRouteManifest.profiles.user} element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
      <Route path={appRouteManifest.profiles.salon} element={<ProtectedRoute><SalonProfile /></ProtectedRoute>} />
      <Route path={appRouteManifest.settings.fiscalTaxes} element={<ProtectedRoute><TaxConfig /></ProtectedRoute>} />
      <Route path={appRouteManifest.settings.fiscalCertificates} element={<ProtectedRoute><FiscalCertificatesSettings /></ProtectedRoute>} />
      <Route path={appRouteManifest.settings.fiscalNfse} element={<ProtectedRoute><NfseSettings /></ProtectedRoute>} />
      <Route path={appRouteManifest.settings.whatsapp} element={<ProtectedRoute><WhatsAppIntegration /></ProtectedRoute>} />
      <Route path={appRouteManifest.settings.systemAdmin} element={<ProtectedRoute><SystemAdminPage /></ProtectedRoute>} />

      <Route path={appRouteManifest.fiscal.invoices} element={<ProtectedRoute><NfseInvoices /></ProtectedRoute>} />
      <Route path={appRouteManifest.fiscal.invoiceCreate} element={<ProtectedRoute><NfseInvoiceForm /></ProtectedRoute>} />
      <Route path={appRouteManifest.fiscal.invoiceDetail} element={<ProtectedRoute><NfseInvoiceDetails /></ProtectedRoute>} />
      <Route path={appRouteManifest.fiscal.invoiceEdit} element={<ProtectedRoute><NfseInvoiceForm /></ProtectedRoute>} />
      <Route path={appRouteManifest.fiscal.invoicePdf} element={<ProtectedRoute><NfseInvoicePdf /></ProtectedRoute>} />
      <Route path={appRouteManifest.fiscal.taxAlias} element={<Navigate to={appRouteManifest.settings.fiscalTaxes} replace />} />
      <Route path={appRouteManifest.fiscal.invoicePreview} element={<ProtectedRoute><InvoicePreview /></ProtectedRoute>} />
      <Route path={appRouteManifest.fiscal.invoiceEmission} element={<ProtectedRoute><InvoiceEmission /></ProtectedRoute>} />
      <Route path={appRouteManifest.fiscal.monthlyTaxStatement} element={<ProtectedRoute><ApuracaoMensal /></ProtectedRoute>} />

      <Route path={appRouteManifest.shell.unauthorized} element={<ProtectedRoute><Unauthorized /></ProtectedRoute>} />
    </>
  );
}
