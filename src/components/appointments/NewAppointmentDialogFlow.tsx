import { Plus, Check } from "lucide-react";
import { AvailableSlotsList } from "@/components/appointments/AvailableSlotsList";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrencyCents } from "@/lib/format";
import type { ManualTimeSlotResponse } from "@/types/available-slots";
import {
  stepItems,
  type NewAppointmentClient,
  type NewAppointmentProfessional,
  type NewAppointmentService,
} from "@/components/appointments/newAppointmentDialog.shared";

type SlotMode = "suggested" | "manual";

type NewAppointmentDialogFlowProps = {
  currentStep: number;
  selectedNewClient: NewAppointmentClient | null;
  selectedNewService: NewAppointmentService | null;
  selectedProfessional: NewAppointmentProfessional | null;
  newClientId: string;
  newClientSearch: string;
  newServiceId: string;
  newDate: string;
  newStartTime: string;
  newEndTime: string;
  effectiveProfessionalId: string;
  isProfessionalUser: boolean;
  slotMode: SlotMode;
  isLoadingSettings: boolean;
  allowManualConflict: boolean;
  filteredClients: NewAppointmentClient[];
  activeServices: NewAppointmentService[];
  availableNewProfessionals: NewAppointmentProfessional[];
  selectedSlot: ManualTimeSlotResponse | null;
  slots: ManualTimeSlotResponse[];
  isLoadingSlots: boolean;
  slotsError: string | null;
  canFetch: boolean;
  hasProfessionalsForSelectedService: boolean;
  isEffectiveProfessionalValid: boolean;
  canChooseService: boolean;
  canChooseProfessional: boolean;
  canChooseDate: boolean;
  canChooseSlot: boolean;
  selectedServiceDuration: number;
  onOpenNewClientDialog: () => void;
  onClientSearchChange: (value: string) => void;
  onClientSelect: (clientId: string) => void;
  onServiceSelect: (serviceId: string) => void;
  onProfessionalChange: (professionalId: string) => void;
  onDateChange: (value: string) => void;
  onSlotModeChange: (mode: SlotMode) => void;
  onSuggestedSlotSelect: (slot: ManualTimeSlotResponse) => void;
  onManualStartTimeChange: (value: string) => void;
};

export function NewAppointmentDialogFlow({
  currentStep,
  selectedNewClient,
  selectedNewService,
  selectedProfessional,
  newClientId,
  newClientSearch,
  newServiceId,
  newDate,
  newStartTime,
  newEndTime,
  effectiveProfessionalId,
  isProfessionalUser,
  slotMode,
  isLoadingSettings,
  allowManualConflict,
  filteredClients,
  activeServices,
  availableNewProfessionals,
  selectedSlot,
  slots,
  isLoadingSlots,
  slotsError,
  canFetch,
  hasProfessionalsForSelectedService,
  isEffectiveProfessionalValid,
  canChooseService,
  canChooseProfessional,
  canChooseDate,
  canChooseSlot,
  selectedServiceDuration,
  onOpenNewClientDialog,
  onClientSearchChange,
  onClientSelect,
  onServiceSelect,
  onProfessionalChange,
  onDateChange,
  onSlotModeChange,
  onSuggestedSlotSelect,
  onManualStartTimeChange,
}: NewAppointmentDialogFlowProps) {
  return (
    <>
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        {stepItems.map((step) => (
          <div key={step.number} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors sm:h-9 sm:w-9 sm:text-sm ${
                currentStep >= step.number
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {currentStep > step.number ? (
                <Check className="h-4 w-4" />
              ) : (
                step.number
              )}
            </div>
            {step.number < stepItems.length ? (
              <div
                className={`mx-1 h-1 w-5 rounded sm:mx-2 sm:w-10 ${
                  currentStep > step.number ? "bg-primary" : "bg-muted"
                }`}
              />
            ) : null}
          </div>
        ))}
      </div>

      <div className="space-y-4 py-4">
        <div
          className={`${currentStep === 1 ? "" : "hidden "}space-y-3 rounded-xl border p-4 ${
            selectedNewClient ? "border-primary/30 bg-primary/[0.03]" : ""
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Etapa 1
              </p>
              <Label className="text-sm">Cliente</Label>
            </div>
            {selectedNewClient ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={onOpenNewClientDialog}
              >
                <Plus className="mr-1 h-4 w-4" /> Novo cliente
              </Button>
            ) : null}
          </div>

          <div className="space-y-3 rounded-lg border border-dashed p-3">
            <Input
              placeholder="Pesquisar cliente por nome, telefone ou email"
              value={newClientSearch}
              onChange={(event) => onClientSearchChange(event.target.value)}
            />
            <div className="max-h-56 space-y-2 overflow-y-auto">
              {filteredClients.length ? (
                filteredClients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    className={`w-full rounded-md border p-3 text-left transition-colors ${
                      newClientId === client.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/40"
                    }`}
                    onClick={() => onClientSelect(client.id)}
                  >
                    <p className="truncate text-sm font-medium">{client.name}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {[client.phone, client.email]
                        .filter(Boolean)
                        .join(" - ") || "Sem contato cadastrado"}
                    </p>
                  </button>
                ))
              ) : (
                <div className="space-y-2 rounded-md border p-3 text-sm">
                  <p>Nenhum cliente encontrado.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={onOpenNewClientDialog}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Cadastrar novo cliente
                  </Button>
                </div>
              )}
            </div>
          </div>

          {!selectedNewClient ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={onOpenNewClientDialog}
            >
              <Plus className="mr-2 h-4 w-4" /> Cliente nao encontrado? Cadastrar
              agora
            </Button>
          ) : (
            <div className="rounded-md border bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/15 text-primary">
                    {selectedNewClient.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {selectedNewClient.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[selectedNewClient.phone, selectedNewClient.email]
                      .filter(Boolean)
                      .join(" - ") || "Sem contato cadastrado"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className={`${currentStep === 2 ? "" : "hidden "}space-y-3 rounded-xl border p-4 ${
            selectedNewService ? "border-primary/30 bg-primary/[0.03]" : ""
          }`}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Etapa 2
            </p>
            <Label className="text-sm">Servico</Label>
            <p className="text-xs text-muted-foreground">
              {canChooseService
                ? "Selecione um servico para filtrar os profissionais compativeis."
                : "Primeiro selecione ou cadastre um cliente."}
            </p>
          </div>
          <div
            className={`max-h-56 space-y-2 overflow-y-auto rounded-md border p-3 ${
              canChooseService ? "" : "pointer-events-none bg-muted/20"
            }`}
          >
            {activeServices.map((service) => (
              <button
                key={service.id}
                type="button"
                className={`flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors ${
                  newServiceId === service.id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/40"
                }`}
                onClick={() => onServiceSelect(service.id)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{service.name}</span>
                    <span className="text-sm text-primary">
                      {formatCurrencyCents(service.price)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{service.category}</span>
                    <span>{service.duration} min</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {selectedNewService ? (
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Servico selecionado</span>
                <span className="font-medium">{selectedNewService.name}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted-foreground">Duracao</span>
                <span>{selectedNewService.duration} min</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-muted-foreground">Valor</span>
                <span className="font-medium text-primary">
                  {formatCurrencyCents(Number(selectedNewService.price))}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <div
          className={`${currentStep === 3 ? "" : "hidden "}space-y-3 rounded-xl border p-4 ${
            isEffectiveProfessionalValid
              ? "border-primary/30 bg-primary/[0.03]"
              : ""
          }`}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Etapa 3
            </p>
            <Label className="text-sm">Profissional</Label>
            <p className="text-xs text-muted-foreground">
              {!canChooseProfessional
                ? "A selecao do profissional depende do servico escolhido."
                : !hasProfessionalsForSelectedService
                  ? "Sem profissional atuando neste servico."
                  : "Agora escolha quem executara esse servico."}
            </p>
          </div>
          <Select
            value={effectiveProfessionalId}
            onValueChange={onProfessionalChange}
            disabled={
              isProfessionalUser ||
              !canChooseProfessional ||
              !hasProfessionalsForSelectedService
            }
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  hasProfessionalsForSelectedService
                    ? "Selecione o profissional"
                    : "Sem profissional atuando neste servico"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableNewProfessionals.map((professional) => (
                <SelectItem key={professional.id} value={professional.id}>
                  {professional.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canChooseProfessional && !hasProfessionalsForSelectedService ? (
            <p className="text-sm text-amber-700">
              Sem profissional atuando neste servico. Ajuste o cadastro do
              servico ou escolha outro.
            </p>
          ) : null}
        </div>

        <div
          className={`${currentStep === 4 ? "" : "hidden "}space-y-3 rounded-xl border p-4 ${
            canChooseDate ? "border-primary/30 bg-primary/[0.03]" : "opacity-60"
          }`}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Etapa 4
            </p>
            <Label className="text-sm">Data</Label>
            <p className="text-xs text-muted-foreground">
              {canChooseDate
                ? "Defina a data para consultar os horarios disponiveis."
                : "A data so fica disponivel depois da escolha do profissional."}
            </p>
          </div>
          <Input
            type="date"
            value={newDate}
            disabled={!canChooseDate}
            onChange={(event) => onDateChange(event.target.value)}
          />
        </div>

        <div
          className={`${currentStep === 4 ? "" : "hidden "}space-y-4 rounded-xl border p-4 ${
            canChooseSlot ? "" : "opacity-60"
          } ${newStartTime ? "border-primary/30 bg-primary/[0.03]" : ""}`}
        >
          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Etapa 5
              </p>
              <p className="text-sm font-medium">Horarios e insercao manual</p>
              <p className="text-xs text-muted-foreground">
                {canChooseSlot
                  ? "Veja horarios vagos, identifique conflitos em vermelho e digite o horario quando precisar."
                  : "Os horarios aparecem quando cliente, servico, profissional e data estiverem definidos."}
              </p>
            </div>
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm lg:min-w-72">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Cliente</span>
                <span className="text-right font-medium">
                  {selectedNewClient?.name || "Nao selecionado"}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Servico</span>
                <span className="font-medium">
                  {selectedNewService?.name || "Nao selecionado"}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Duracao</span>
                <span className="font-medium">{selectedServiceDuration} min</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Valor</span>
                <span className="font-medium text-primary">
                  {formatCurrencyCents(Number(selectedNewService?.price || 0))}
                </span>
              </div>
            </div>
          </div>

          {isLoadingSettings ? (
            <p className="text-xs text-muted-foreground">
              Carregando politica de conflito da agenda...
            </p>
          ) : allowManualConflict ? (
            <Alert className="border-red-200 bg-red-50 text-red-950">
              <AlertTitle>
                Conflito manual permitido neste estabelecimento
              </AlertTitle>
              <AlertDescription>
                Os horarios vagos continuam como referencia principal. Horarios em
                conflito aparecem em vermelho e exigem confirmacao explicita antes
                da criacao.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertTitle>Agenda interna em modo estrito</AlertTitle>
              <AlertDescription>
                Os horarios vagos continuam visiveis normalmente. Horarios em
                conflito nao podem ser assumidos neste estabelecimento.
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={slotMode} onValueChange={(value) => onSlotModeChange(value as SlotMode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="suggested">Sugestoes</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>

            <TabsContent value="suggested" className="space-y-3">
              <AvailableSlotsList
                slots={slots}
                isLoading={isLoadingSlots}
                error={slotsError}
                canFetch={canFetch}
                selectedStartTime={newStartTime}
                onSelect={onSuggestedSlotSelect}
              />
            </TabsContent>

            <TabsContent value="manual" className="space-y-3">
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">Horario manual</p>
                    <p className="text-xs text-muted-foreground">
                      Digite o horario inicial. O horario final sera calculado
                      automaticamente.
                    </p>
                  </div>
                  <Badge variant="outline">Entrada direta</Badge>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="manual-start-time">Horario inicial</Label>
                    <Input
                      id="manual-start-time"
                      type="time"
                      step={300}
                      value={newStartTime}
                      disabled={!canChooseSlot}
                      onChange={(event) =>
                        onManualStartTimeChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manual-end-time">Horario final</Label>
                    <Input
                      id="manual-end-time"
                      type="time"
                      value={newEndTime}
                      disabled
                    />
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Se o horario digitado conflitar com outro atendimento e a
                  configuracao do estabelecimento permitir, o sistema vai pedir
                  confirmacao antes de salvar.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {selectedSlot?.conflicting ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Horario em conflito com {selectedSlot.conflicts?.length || 1}{" "}
              atendimento(s). A criacao exigira confirmacao explicita.
            </div>
          ) : null}

          {newStartTime && newEndTime ? (
            <p className="text-xs text-muted-foreground">
              Selecionado: {newStartTime} - {newEndTime}
            </p>
          ) : null}
        </div>
      </div>

      {currentStep === 5 ? (
        <div className="space-y-4 rounded-xl border p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Etapa 5
            </p>
            <p className="text-lg font-semibold">Revise antes de criar</p>
            <p className="text-sm text-muted-foreground">
              Confira os dados principais do atendimento antes da confirmacao
              final.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cliente
              </p>
              <p className="mt-2 font-medium">
                {selectedNewClient?.name || "Nao selecionado"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {[selectedNewClient?.phone, selectedNewClient?.email]
                  .filter(Boolean)
                  .join(" - ") || "Sem contato cadastrado"}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Servico
              </p>
              <p className="mt-2 font-medium">
                {selectedNewService?.name || "Nao selecionado"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedServiceDuration} min {" - "}
                {formatCurrencyCents(Number(selectedNewService?.price || 0))}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Profissional
              </p>
              <p className="mt-2 font-medium">
                {selectedProfessional?.name || "Nao selecionado"}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Agenda
              </p>
              <p className="mt-2 font-medium">{newDate || "Data nao informada"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {newStartTime && newEndTime
                  ? `${newStartTime} - ${newEndTime}`
                  : "Horario nao informado"}
              </p>
            </div>
          </div>
          {selectedSlot?.conflicting && allowManualConflict ? (
            <Alert className="border-red-200 bg-red-50 text-red-950">
              <AlertTitle>Horario com sobreposicao assumida manualmente</AlertTitle>
              <AlertDescription>
                Este horario ja possui atendimento para o mesmo profissional. Ao
                confirmar, o sistema ainda exigira sua confirmacao explicita.
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
