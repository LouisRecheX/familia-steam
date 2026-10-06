# Família Steam: como colocar no ar (Vercel + Supabase)

Tempo estimado: 30 minutos. Tudo é gratuito para esse uso.

## 1. Criar o banco (Supabase)
1. Em supabase.com, crie uma conta e um projeto novo (anote a senha do banco).
2. Menu **SQL Editor** > **New query**: cole todo o conteúdo de `supabase.sql` e clique em **Run**.

## 2. Criar os 6 logins (sem tela de cadastro)
1. Menu **Authentication > Providers > Email**: desligue **Confirm email**.
2. Menu **Authentication > Sign In / Providers** (ou Settings): desligue **Allow new users to sign up**, para ninguém de fora criar conta.
3. Menu **Authentication > Users > Add user > Create new user**. Crie um por membro, marcando **Auto Confirm User**:

| Usuário (o que a pessoa digita) | E-mail a cadastrar no Supabase |
|---|---|
| marllon | marllon@familiasteam.app |
| keren | keren@familiasteam.app |
| borges | borges@familiasteam.app |
| jonathan | jonathan@familiasteam.app |
| gilney | gilney@familiasteam.app |
| luiz | luiz@familiasteam.app |

A senha é a que você escolher para cada um. O perfil é criado sozinho, e o **luiz** vira administrador automaticamente.
Esqueceu uma senha? Altere em Authentication > Users (o e-mail é fictício, então "esqueci a senha" por e-mail não funciona).

## 3. Ligar o site ao banco
1. Em **Project Settings > API**, copie a **Project URL** e a chave **anon public**.
2. Abra `index.html` num editor e troque, no início do script, `COLE_AQUI_A_URL_DO_PROJETO` e `COLE_AQUI_A_CHAVE_ANON`.
   Use somente a chave **anon**. Nunca coloque a `service_role` no site.

## 4. Publicar no Vercel
- Opção simples: instale o Node, abra o terminal nesta pasta e rode `npx vercel` (siga as perguntas; é um site estático, sem build).
- Ou suba esta pasta para um repositório no GitHub e importe em vercel.com/new.

## 5. Testar
Entre como `luiz`, adicione um jogo e uma foto. Depois entre com outro usuário (aba anônima) e confira: ele deve ver tudo, mas só poder votar, mexer na wishlist e no próprio orçamento.

## Quem pode o quê
- **Luiz (admin):** adiciona/edita/exclui jogos, fotos e pagamentos, transforma votações em jogos e apaga qualquer item.
- **Demais membros:** veem tudo, adicionam jogos à wishlist e propõem votações (com o próprio nome), votam, definem o próprio orçamento mensal e apagam o que criaram.
- Essas regras são aplicadas pelo banco, e não só escondidas na tela.

## Jogos do site antigo
Os jogos do site antigo ficam no navegador de quem usou e não passam sozinhos. Entre como luiz e recadastre, ou envie o arquivo salvo do site antigo para a importação ser preparada.
