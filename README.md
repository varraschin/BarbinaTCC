🍽️ Restaurante Barbina — Sistema Web
Projeto de TCC composto por uma API RESTful (.NET 10) e um site MVC (.NET 10), usando MySQL via XAMPP.
---
📁 Estrutura
```
Barbina/
├── Barbina.sln
├── Barbina.API/          ← API REST (porta 5058)
└── Barbina.UI/           ← Site MVC  (porta 5057)
```
---
⚙️ Pré-requisitos
.NET 10 SDK
XAMPP (MySQL rodando na porta 3306)
Visual Studio 2022 ou VS Code
---
🚀 Passo a Passo para Rodar
1. Banco de Dados
Abra o XAMPP e inicie o MySQL. Não precisa criar o banco manualmente — o sistema cria automaticamente na primeira execução.
2. Configurar a connection string (se necessário)
Em `Barbina.API/appsettings.json`, ajuste o campo `uid` e `pwd` conforme seu MySQL:
```json
"Conexao": "server=localhost;port=3306;database=barbina_db;uid=root;pwd=''"
```
> Se o seu MySQL tiver senha, substitua `''` pela senha.
3. Rodar a API
```bash
cd Barbina.API
dotnet run
```
A API ficará disponível em: http://localhost:5058  
Swagger: http://localhost:5058 (página inicial)
4. Rodar o Site MVC
Em outro terminal:
```bash
cd Barbina.UI
dotnet run
```
O site ficará disponível em: http://localhost:5057
---
🌐 Páginas do Site
URL	Descrição
`/`	Página inicial com destaques
`/home/cardapio`	Cardápio dinâmico (carregado da API)
`/home/ambientes`	Galeria de ambientes
`/home/reservas`	Formulário de reserva
`/home/contato`	Contato e FAQ
`/admin`	Redireciona para login admin
`/admin/auth/login`	Login administrativo
`/admin`	Dashboard (após login)
`/admin/produtos`	CRUD de produtos
`/admin/categorias`	CRUD de categorias
---
📌 Observações
Para acessar a área admin, acesse `/admin` — não há botão no site público (por design).
O banco é populado automaticamente com categorias e produtos de exemplo.
Imagens dos produtos/categorias são salvas na pasta `wwwroot/img/` da API.
