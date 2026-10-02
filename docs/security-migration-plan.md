# Plano de segurança e migração

## Decisões atuais

- Firebase Authentication continua responsável por Google e e-mail/senha.
- MongoDB, Firestore e Supabase permanecem intactos durante o inventário.
- MariaDB será o destino progressivo e a fonte de autorização do painel.
- Nenhuma migração deve ser executada diretamente em produção.

## Controles já preparados

- Tokens Firebase são verificados pelo Firebase Admin no backend.
- Tokens decodificados sem assinatura e sessões locais não são aceitos.
- O modelo RBAC começa sem nenhum administrador atribuído.
- Toda rota administrativa deve exigir autenticação e uma permissão explícita.
- Falhas do MariaDB bloqueiam o acesso administrativo; não há modo permissivo.

## Próxima etapa: inventário somente leitura

O inventário deve produzir, por origem:

- quantidade de usuários e identificadores Firebase conhecidos;
- quantidade de meses por usuário;
- menor e maior `monthId`;
- quantidade e soma de despesas, receitas, investimentos e reservas;
- registros sem proprietário ou com formato inválido;
- colisões de `userId + monthId` entre MongoDB, Firestore e Supabase;
- hash canônico de cada mês para detectar cópias idênticas.

O relatório não deve incluir senhas, tokens, chaves, recibos ou descrições
financeiras completas. Divergências serão resolvidas em homologação antes do
corte para MariaDB.

## Ordem de implantação

1. Revogar qualquer credencial anteriormente gravada no frontend.
2. Configurar a conta de serviço Firebase no backend da homologação.
3. Criar o esquema RBAC no MariaDB de homologação.
4. Executar o inventário somente leitura nos bancos legados.
5. Construir e testar o importador idempotente.
6. Validar totais e amostras com o proprietário dos dados.
7. Planejar janela de corte, delta final e rollback.
