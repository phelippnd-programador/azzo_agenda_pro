# Checklist de Homologacao - LGPD Frontend

Data base: 2026-03-01  
Escopo: validar interface LGPD integrada ao backend.

## 1. Acesso e navegacao
- [ ] Menu lateral exibe item `LGPD Titulares` para usuario com acesso a `/auditoria`.
- [ ] Rota protegida `/auditoria/lgpd` abre sem erro para perfil autorizado.
- [ ] Acesso sem autenticacao redireciona para login.

## 2. Fluxo de solicitacoes LGPD
- [ ] Criar solicitacao em `/auditoria/lgpd` retorna protocolo.
- [ ] Listagem mostra solicitacao criada.
- [ ] Detalhe por ID mostra historico de eventos.
- [ ] Busca por protocolo retorna a solicitacao correta.

## 3. Status e operacao
- [ ] Atualizacao de status `ABERTO -> EM_VALIDACAO` funciona.
- [ ] Atualizacao de status `EM_VALIDACAO -> RESPONDIDO` funciona.
- [ ] Atualizacao de status `RESPONDIDO -> ENCERRADO` funciona.
- [ ] Transicao invalida mostra erro amigavel na UI.

## 4. Conteudo legal e contato LGPD
- [ ] Tela de documento legal exibe bloco de contato LGPD quando backend retornar dados.
- [ ] Endpoint `/public/legal/contact` consumido sem erro.
- [ ] `email`, `channel` e `responseSla` aparecem corretamente na UI.

## 5. Tratamento de erros
- [ ] Falha de rede em criar/listar/detalhar mostra mensagem clara.
- [ ] Falha de permissao (401/403) segue padrao da aplicacao.
- [ ] Falha de validacao (400) mostra feedback util ao usuario.

## 6. Evidencias obrigatorias
- [ ] Screenshot da tela `/auditoria/lgpd` com lista + detalhe.
- [ ] Screenshot de busca por protocolo.
- [ ] Screenshot de atualizacao de status bem-sucedida.
- [ ] Screenshot de erro de transicao invalida.
- [ ] Screenshot de documento legal com contato LGPD.

## 7. Resultado final
- [ ] APROVADO
- [ ] APROVADO COM RESSALVAS
- [ ] REPROVADO

Observacoes:
- 
