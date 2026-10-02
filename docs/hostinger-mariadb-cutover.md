# Corte controlado para MariaDB na Hostinger

## Estado seguro inicial

Mantenha `DATA_BACKEND=mongodb` enquanto valida a aplicação. O banco MariaDB de
homologação pode permanecer preenchido sem receber gravações do aplicativo.
Firebase Authentication continua sendo a autenticação; o backend valida o token
e vincula o `firebase_uid` ao registro ativo de `app_users`.

## Variáveis do backend na Hostinger

Configure estas variáveis no hPanel, sem o prefixo `VITE_`:

```env
DATA_BACKEND=mariadb
DB_HOST=host-informado-pela-hostinger
DB_PORT=3306
DB_USER=usuario-mysql
DB_PASSWORD=senha-rotacionada
DB_NAME=banco-mysql
DB_CONNECTION_LIMIT=5
DB_SSL=false

FIREBASE_PROJECT_ID=projeto-firebase
FIREBASE_CLIENT_EMAIL=conta-de-servico
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Use exatamente o host exibido no hPanel. Não presuma `localhost` sem confirmar.
Não coloque `DB_PASSWORD` ou `FIREBASE_PRIVATE_KEY` no Git, no frontend ou em
qualquer variável `VITE_*`.

## Validação antes do corte

1. Faça um novo backup/export do MongoDB e preserve o arquivo sem alterações.
2. Confirme no MariaDB os 30 meses e os totais já inventariados.
3. Suba a aplicação primeiro com `DATA_BACKEND=mongodb` e valide o login.
4. Troque para `DATA_BACKEND=mariadb` e reinicie a aplicação pelo hPanel.
5. Confirme que `/api/db-status` informa MariaDB configurado, conectado e ativo.
6. Confira visualmente meses antigos, despesas, rendas extras, reservas e investimentos.
7. Faça uma alteração pequena e reversível; recarregue a página e confirme a persistência.

## Rollback

Se qualquer validação falhar, volte `DATA_BACKEND=mongodb` e reinicie a
aplicação. Não apague nem altere o MongoDB, Firebase, Supabase ou os arquivos de
exportação durante esta fase.

## Resultado esperado do inventário atual

- 30 meses, de `2026-04` a `2028-09`;
- 290 despesas;
- 17 rendas extras;
- 2 registros de reserva;
- 16 investimentos.
