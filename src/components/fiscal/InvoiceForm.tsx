import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { InvoiceFormData, InvoiceItem, InvoiceCustomer } from '@/types/invoice';
import { CFOP_CODES, CST_CODES } from '@/types/fiscal';
import { toast } from 'sonner';

interface InvoiceFormProps {
  onSubmit: (data: InvoiceFormData, isDraft: boolean) => void;
  initialData?: Partial<InvoiceFormData>;
}

export function InvoiceForm({ onSubmit, initialData }: InvoiceFormProps) {
  const [type, setType] = useState<'NFE' | 'NFCE'>(initialData?.type || 'NFCE');
  const [operationNature, setOperationNature] = useState(
    initialData?.operationNature || 'Prestação de serviços'
  );
  const [notes, setNotes] = useState(initialData?.notes || '');

  const [customer, setCustomer] = useState<InvoiceCustomer>(
    initialData?.customer || {
      type: 'CPF',
      document: '',
      name: '',
      email: '',
      phone: '',
    }
  );

  const [items, setItems] = useState<InvoiceItem[]>(
    initialData?.items || [
      {
        id: '1',
        description: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        cfop: '5.933',
        cst: '00',
      },
    ]
  );

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: String(Date.now()),
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      cfop: '5.933',
      cst: '00',
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    } else {
      toast.error('Deve haver pelo menos um item');
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.totalPrice = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const validateForm = (): boolean => {
    if (!customer.document || !customer.name) {
      toast.error('Preencha os dados do cliente');
      return false;
    }

    for (const item of items) {
      if (!item.description || item.unitPrice <= 0) {
        toast.error('Preencha todos os itens corretamente (descrição e valor)');
        return false;
      }

      if (!item.cfop) {
        toast.error('CFOP é obrigatório para todos os itens');
        return false;
      }

      if (!item.cst) {
        toast.error('CST é obrigatório para todos os itens');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = (isDraft: boolean) => {
    if (!validateForm()) return;

    const formData: InvoiceFormData = {
      type,
      customer,
      items,
      operationNature,
      notes,
      appointmentId: initialData?.appointmentId,
    };

    onSubmit(formData, isDraft);
  };

  return (
    <div className="space-y-6">
      {/* Invoice Type */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Nota Fiscal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={type === 'NFCE' ? 'default' : 'outline'}
              onClick={() => setType('NFCE')}
              className="h-20"
            >
              <div className="text-center">
                <div className="font-bold">NFC-e</div>
                <div className="text-xs">Modelo 65</div>
                <div className="text-xs opacity-70">Consumidor Final</div>
              </div>
            </Button>
            <Button
              variant={type === 'NFE' ? 'default' : 'outline'}
              onClick={() => setType('NFE')}
              className="h-20"
            >
              <div className="text-center">
                <div className="font-bold">NF-e</div>
                <div className="text-xs">Modelo 55</div>
                <div className="text-xs opacity-70">Pessoa Jurídica</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer Data */}
      <Card>
        <CardHeader>
          <CardTitle>Dados do Tomador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <Select
                value={customer.type}
                onValueChange={(value: 'CPF' | 'CNPJ') =>
                  setCustomer({ ...customer, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CPF">CPF</SelectItem>
                  <SelectItem value="CNPJ">CNPJ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{customer.type}</Label>
              <Input
                placeholder={customer.type === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                value={customer.document}
                onChange={(e) => setCustomer({ ...customer, document: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Nome/Razão Social</Label>
              <Input
                placeholder="Nome completo"
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email (opcional)</Label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={customer.email || ''}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone (opcional)</Label>
              <Input
                placeholder="(00) 00000-0000"
                value={customer.phone || ''}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Serviços Prestados</span>
            <Button size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Item
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Item {index + 1}</span>
                {items.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Descrição *</Label>
                  <Input
                    placeholder="Ex: Corte de cabelo"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Unitário *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              {/* CFOP and CST - Required Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    CFOP *
                    <span className="text-xs text-muted-foreground">(obrigatório)</span>
                  </Label>
                  <Select
                    value={item.cfop}
                    onValueChange={(value) => updateItem(item.id, 'cfop', value)}
                  >
                    <SelectTrigger className={!item.cfop ? 'border-red-300' : ''}>
                      <SelectValue placeholder="Selecione o CFOP" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CFOP_CODES).map(([code, description]) => (
                        <SelectItem key={code} value={code}>
                          {code} - {description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!item.cfop && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      CFOP é obrigatório
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    CST *
                    <span className="text-xs text-muted-foreground">(obrigatório)</span>
                  </Label>
                  <Select
                    value={item.cst}
                    onValueChange={(value) => updateItem(item.id, 'cst', value)}
                  >
                    <SelectTrigger className={!item.cst ? 'border-red-300' : ''}>
                      <SelectValue placeholder="Selecione o CST" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CST_CODES).map(([code, description]) => (
                        <SelectItem key={code} value={code}>
                          {code} - {description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!item.cst && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      CST é obrigatório
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Total</Label>
                  <Input
                    value={formatCurrency(item.totalPrice)}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Adicionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Natureza da Operação</Label>
            <Input
              value={operationNature}
              onChange={(e) => setOperationNature(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea
              placeholder="Informações complementares..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Total */}
      <Card className="bg-gradient-to-r from-violet-50 to-pink-50">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">Valor Total da Nota:</span>
            <span className="text-3xl font-bold text-violet-700">
              {formatCurrency(calculateTotal())}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => handleSubmit(true)}>
          Salvar Rascunho
        </Button>
        <Button onClick={() => handleSubmit(false)} className="bg-violet-600 hover:bg-violet-700">
          Emitir Nota Fiscal
        </Button>
      </div>
    </div>
  );
}