import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, Clock, DollarSign, MoreVertical, Scissors, Loader2 } from 'lucide-react';
import { useServices } from '@/hooks/useServices';
import { useProfessionals } from '@/hooks/useProfessionals';
import { toast } from 'sonner';

const categories = ['Todos', 'Cabelo', 'Barba', 'Unhas', 'Estética', 'Maquiagem', 'Outros'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function Services() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingService, setEditingService] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDuration, setFormDuration] = useState('60');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('Cabelo');
  const [formProfessionalIds, setFormProfessionalIds] = useState<string[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);

  const { services, isLoading, createService, updateService, deleteService } = useServices();
  const { professionals, isLoading: isLoadingProfessionals } = useProfessionals();

  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormDuration('60');
    setFormPrice('');
    setFormCategory('Cabelo');
    setFormProfessionalIds([]);
    setFormIsActive(true);
    setEditingService(null);
  };

  const openEditDialog = (service: typeof services[0]) => {
    setFormName(service.name);
    setFormDescription(service.description);
    setFormDuration(String(service.duration));
    setFormPrice(String(service.price));
    setFormCategory(service.category);
    setFormProfessionalIds(Array.isArray(service.professionalIds) ? service.professionalIds : []);
    setFormIsActive(service.isActive);
    setEditingService(service.id);
    setIsNewServiceOpen(true);
  };

  const toggleProfessional = (professionalId: string) => {
    setFormProfessionalIds((prev) =>
      prev.includes(professionalId)
        ? prev.filter((id) => id !== professionalId)
        : [...prev, professionalId]
    );
  };

  const handleSubmit = async () => {
    if (!formName || !formPrice || !formDuration) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);
    try {
      const serviceData = {
        name: formName,
        description: formDescription,
        duration: parseInt(formDuration),
        price: parseFloat(formPrice),
        category: formCategory,
        professionalIds: formProfessionalIds,
        isActive: formIsActive,
      };

      if (editingService) {
        await updateService(editingService, serviceData);
      } else {
        await createService(serviceData);
      }

      setIsNewServiceOpen(false);
      resetForm();
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteService(id);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateService(id, { isActive });
    } catch (error) {
      // Error is handled in the hook
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Serviços" subtitle="Gerencie os serviços oferecidos">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Serviços" subtitle="Gerencie os serviços oferecidos">
      <div className="space-y-4 sm:space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar serviços..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Dialog open={isNewServiceOpen} onOpenChange={(open) => {
            setIsNewServiceOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-violet-600 hover:bg-violet-700">
                <Plus className="w-4 h-4" />
                Novo Serviço
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-4 sm:mx-auto max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingService ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
                <DialogDescription>
                  {editingService ? 'Atualize os dados do serviço' : 'Preencha os dados do novo serviço'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome do Serviço *</Label>
                  <Input
                    placeholder="Ex: Corte Feminino"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Descreva o serviço..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duração (min) *</Label>
                    <Input
                      type="number"
                      placeholder="60"
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preço (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="80.00"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c !== 'Todos').map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Profissionais</Label>
                  <div className="rounded-lg border p-3 space-y-3 max-h-48 overflow-y-auto">
                    {isLoadingProfessionals ? (
                      <p className="text-sm text-gray-500">Carregando profissionais...</p>
                    ) : !professionals.length ? (
                      <p className="text-sm text-gray-500">Nenhum profissional cadastrado.</p>
                    ) : (
                      professionals.map((professional) => (
                        <label
                          key={professional.id}
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <Checkbox
                            checked={formProfessionalIds.includes(professional.id)}
                            onCheckedChange={() => toggleProfessional(professional.id)}
                          />
                          <span>{professional.name}</span>
                          {!professional.isActive ? (
                            <Badge variant="outline" className="text-[10px] text-gray-500">
                              Inativo
                            </Badge>
                          ) : null}
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Se nenhum profissional for selecionado, o servico fica disponivel para todos.
                  </p>
                  {formProfessionalIds.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {formProfessionalIds.map((id) => {
                        const professional = professionals.find((item) => item.id === id);
                        if (!professional) return null;
                        return (
                          <Badge key={id} variant="secondary" className="text-[10px] sm:text-xs">
                            {professional.name}
                          </Badge>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Serviço Ativo</Label>
                    <p className="text-xs text-gray-500">Disponível para agendamento</p>
                  </div>
                  <Switch
                    checked={formIsActive}
                    onCheckedChange={setFormIsActive}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsNewServiceOpen(false);
                  resetForm();
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingService ? 'Salvando...' : 'Criando...'}
                    </>
                  ) : (
                    editingService ? 'Salvar' : 'Criar Serviço'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={`whitespace-nowrap text-xs sm:text-sm ${
                selectedCategory === category ? 'bg-violet-600 hover:bg-violet-700' : ''
              }`}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Scissors className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum serviço encontrado</p>
              <Button
                variant="link"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('Todos');
                }}
              >
                Limpar filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredServices.map((service) => (
              <Card
                key={service.id}
                className={`hover:shadow-md transition-shadow ${!service.isActive && 'opacity-60'}`}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                          {service.name}
                        </h3>
                        {!service.isActive && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs text-gray-500">
                            Inativo
                          </Badge>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-[10px] sm:text-xs">
                        {service.category}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(service)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(service.id, !service.isActive)}>
                          {service.isActive ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(service.id)}
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-2">
                    {service.description || 'Sem descrição'}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">{service.duration} min</span>
                    </div>
                    <div className="flex items-center gap-1 text-violet-600 font-semibold">
                      <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-sm sm:text-base">{formatCurrency(service.price)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
