import type { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { LicenseFormValues } from "@/components/billing/types";

type CreditCardFormProps = {
  form: UseFormReturn<LicenseFormValues>;
};

export function CreditCardForm({ form }: CreditCardFormProps) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4">
      <h3 className="font-semibold text-foreground">Dados do cartao</h3>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="creditCardHolderName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome impresso no cartao</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo" autoComplete="cc-name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="creditCardNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numero do cartao</FormLabel>
              <FormControl>
                <Input placeholder="0000 0000 0000 0000" autoComplete="cc-number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={form.control}
          name="creditCardExpiryMonth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mes</FormLabel>
              <FormControl>
                <Input placeholder="12" autoComplete="cc-exp-month" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="creditCardExpiryYear"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ano</FormLabel>
              <FormControl>
                <Input placeholder="2030" autoComplete="cc-exp-year" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="creditCardCcv"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CVV</FormLabel>
              <FormControl>
                <Input placeholder="123" autoComplete="cc-csc" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <h3 className="pt-2 font-semibold text-foreground">Dados do titular</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="holderName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo" autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="holderEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@dominio.com" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="holderCpfCnpj"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF/CNPJ do titular</FormLabel>
              <FormControl>
                <Input placeholder="Somente numeros" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="holderPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input placeholder="(11) 99999-9999" autoComplete="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="holderPostalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CEP</FormLabel>
              <FormControl>
                <Input placeholder="00000000" autoComplete="postal-code" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="holderAddressNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numero</FormLabel>
              <FormControl>
                <Input placeholder="123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="holderAddressComplement"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Complemento (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Apto, bloco, referencia..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

