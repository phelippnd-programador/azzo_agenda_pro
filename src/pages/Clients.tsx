import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Search,
  Plus,
  MoreVertical,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Grid3X3,
  List,
  Users,
  Loader2,
} from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { toast } from 'sonner';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingClient, setEditingClient] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const { clients, isLoading, createClient, updateClient, deleteClient } = useClients();

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormBirthDate('');
    setFormNotes('');
    setEditingClient(null);
  };

  const openEditDialog = (client: typeof clients[0]) => {
    setFormName(client.name);
    setFormEmail(client.email);
    setFormPhone(client.phone);
    setFormBirthDate(client.birthDate || '');
    setFormNotes(client.notes || '');
    setEditingClient(client.id);
    setIsNewClientOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName || !formPhone) {
      toast.error('Nome e telefone são obrigatórios');
      return;
    }

    setIsSubmitting(true);
    try {
      const clientData = {
        name: formName,
        email: formEmail,
        phone: formPhone,
        birthDate: formBirthDate || undefined,
        notes: formNotes || undefined,
      };

      if (editingClient) {
        await updateClient(editingClient, clientData);
      } else {
        await createClient(clientData);
      }

      setIsNewClientOpen(false);
      resetForm();
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteClient(id);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Clientes" subtitle="Gerencie sua base de clientes">
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
    <MainLayout title="Clientes" subtitle="Gerencie sua base de clientes">
      <div className="space-y-4 sm:space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="rounded-none h-8 w-8 sm:h-9 sm:w-9"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('table')}
                className="rounded-none h-8 w-8 sm:h-9 sm:w-9"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <Dialog open={isNewClientOpen} onOpenChange={(open) => {
              setIsNewClientOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-violet-600 hover:bg-violet-700">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Novo</span> Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md mx-4 sm:mx-auto">
                <DialogHeader>
                  <DialogTitle>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
                  <DialogDescription>
                    {editingClient ? 'Atualize os dados do cliente' : 'Cadastre um novo cliente'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome Completo *</Label>
                    <Input
                      placeholder="Nome do cliente"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Telefone *</Label>
                      <Input
                        placeholder="(11) 99999-0000"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>E-mail</Label>
                      <Input
                        type="email"
                        placeholder="email@exemplo.com"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Nascimento</Label>
                    <Input
                      type="date"
                      value={formBirthDate}
                      onChange={(e) => setFormBirthDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      placeholder="Preferências, alergias, etc."
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsNewClientOpen(false);
                    resetForm();
                  }}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {editingClient ? 'Salvando...' : 'Cadastrando...'}
                      </>
                    ) : (
                      editingClient ? 'Salvar' : 'Cadastrar'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-lg sm:text-2xl font-bold text-violet-600">{clients.length}</p>
              <p className="text-xs sm:text-sm text-gray-500">Total de Clientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-lg sm:text-2xl font-bold text-green-600">
                {clients.filter(c => c.lastVisit && new Date(c.lastVisit) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">Ativos (30 dias)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-lg sm:text-2xl font-bold text-pink-600">
                {formatCurrency(clients.reduce((sum, c) => sum + c.totalSpent, 0))}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">Faturamento Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Clients List */}
        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum cliente encontrado</p>
              {searchTerm && (
                <Button variant="link" onClick={() => setSearchTerm('')}>
                  Limpar busca
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                        <AvatarFallback className="bg-pink-100 text-pink-700 text-sm">
                          {client.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                          {client.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {client.totalVisits} visitas
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(client)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>Ver Histórico</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(client.id)}
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">{client.phone}</span>
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="text-xs sm:text-sm truncate">{client.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                    <div>
                      <div className="flex items-center gap-1 text-gray-500 mb-1">
                        <Calendar className="w-3 h-3" />
                        <span className="text-[10px] sm:text-xs">Última visita</span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium">
                        {client.lastVisit
                          ? new Date(client.lastVisit).toLocaleDateString('pt-BR')
                          : 'Nunca'}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-gray-500 mb-1">
                        <DollarSign className="w-3 h-3" />
                        <span className="text-[10px] sm:text-xs">Total gasto</span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-violet-600">
                        {formatCurrency(client.totalSpent)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                    <TableHead className="hidden md:table-cell">E-mail</TableHead>
                    <TableHead className="text-center">Visitas</TableHead>
                    <TableHead className="text-right">Total Gasto</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarFallback className="bg-pink-100 text-pink-700 text-xs">
                              {client.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate max-w-[120px] sm:max-w-none">
                              {client.name}
                            </p>
                            <p className="text-xs text-gray-500 sm:hidden">{client.phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{client.phone}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm truncate max-w-[150px]">
                        {client.email || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-xs">
                          {client.totalVisits}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-violet-600 text-sm">
                        {formatCurrency(client.totalSpent)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(client)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>Ver Histórico</DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(client.id)}
                            >
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}