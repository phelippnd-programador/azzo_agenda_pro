import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Search, Plus, MoreVertical, Phone, Mail, Percent, Users, Loader2 } from 'lucide-react';
import { useProfessionals } from '@/hooks/useProfessionals';
import { toast } from 'sonner';

export default function Professionals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewProfessionalOpen, setIsNewProfessionalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSpecialties, setFormSpecialties] = useState('');
  const [formCommission, setFormCommission] = useState('40');
  const [formIsActive, setFormIsActive] = useState(true);

  const { professionals, isLoading, createProfessional, updateProfessional, deleteProfessional } = useProfessionals();

  const filteredProfessionals = professionals.filter((prof) =>
    prof.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prof.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prof.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormSpecialties('');
    setFormCommission('40');
    setFormIsActive(true);
    setEditingProfessional(null);
  };

  const openEditDialog = (prof: typeof professionals[0]) => {
    setFormName(prof.name);
    setFormEmail(prof.email);
    setFormPhone(prof.phone);
    setFormSpecialties(prof.specialties.join(', '));
    setFormCommission(String(prof.commissionRate));
    setFormIsActive(prof.isActive);
    setEditingProfessional(prof.id);
    setIsNewProfessionalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName || !formEmail || !formPhone) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);
    try {
      const professionalData = {
        name: formName,
        email: formEmail,
        phone: formPhone,
        specialties: formSpecialties.split(',').map(s => s.trim()).filter(Boolean),
        commissionRate: parseInt(formCommission),
        isActive: formIsActive,
      };

      if (editingProfessional) {
        await updateProfessional(editingProfessional, professionalData);
      } else {
        await createProfessional(professionalData);
      }

      setIsNewProfessionalOpen(false);
      resetForm();
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProfessional(id);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateProfessional(id, { isActive });
    } catch (error) {
      // Error is handled in the hook
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Profissionais" subtitle="Gerencie sua equipe">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Profissionais" subtitle="Gerencie sua equipe">
      <div className="space-y-4 sm:space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar profissionais..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Dialog open={isNewProfessionalOpen} onOpenChange={(open) => {
            setIsNewProfessionalOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-violet-600 hover:bg-violet-700">
                <Plus className="w-4 h-4" />
                Novo Profissional
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-4 sm:mx-auto">
              <DialogHeader>
                <DialogTitle>{editingProfessional ? 'Editar Profissional' : 'Novo Profissional'}</DialogTitle>
                <DialogDescription>
                  {editingProfessional ? 'Atualize os dados do profissional' : 'Adicione um novo membro à equipe'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input
                    placeholder="Nome do profissional"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>E-mail *</Label>
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone *</Label>
                    <Input
                      placeholder="(11) 99999-0000"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Especialidades</Label>
                  <Input
                    placeholder="Corte, Coloração, Escova (separar por vírgula)"
                    value={formSpecialties}
                    onChange={(e) => setFormSpecialties(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Taxa de Comissão (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="40"
                    value={formCommission}
                    onChange={(e) => setFormCommission(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Profissional Ativo</Label>
                    <p className="text-xs text-gray-500">Disponível para agendamentos</p>
                  </div>
                  <Switch
                    checked={formIsActive}
                    onCheckedChange={setFormIsActive}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsNewProfessionalOpen(false);
                  resetForm();
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingProfessional ? 'Salvando...' : 'Adicionando...'}
                    </>
                  ) : (
                    editingProfessional ? 'Salvar' : 'Adicionar'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Professionals Grid */}
        {filteredProfessionals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum profissional encontrado</p>
              {searchTerm && (
                <Button variant="link" onClick={() => setSearchTerm('')}>
                  Limpar busca
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredProfessionals.map((professional) => (
              <Card
                key={professional.id}
                className={`hover:shadow-md transition-shadow ${!professional.isActive && 'opacity-60'}`}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0">
                        <AvatarImage src={professional.avatar} />
                        <AvatarFallback className="bg-violet-100 text-violet-700 text-sm sm:text-base">
                          {professional.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                          {professional.name}
                        </h3>
                        <Badge
                          variant={professional.isActive ? 'default' : 'secondary'}
                          className={`text-[10px] sm:text-xs ${professional.isActive ? 'bg-green-100 text-green-700' : ''}`}
                        >
                          {professional.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(professional)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(professional.id, !professional.isActive)}>
                          {professional.isActive ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(professional.id)}
                        >
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm truncate">{professional.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">{professional.phone}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {professional.specialties.slice(0, 3).map((specialty, index) => (
                      <Badge key={index} variant="outline" className="text-[10px] sm:text-xs">
                        {specialty}
                      </Badge>
                    ))}
                    {professional.specialties.length > 3 && (
                      <Badge variant="outline" className="text-[10px] sm:text-xs">
                        +{professional.specialties.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs sm:text-sm text-gray-500">Comissão</span>
                    <div className="flex items-center gap-1 text-violet-600 font-semibold">
                      <Percent className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-sm sm:text-base">{professional.commissionRate}%</span>
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