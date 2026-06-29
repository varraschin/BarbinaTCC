using Barbina.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Barbina.API.Data;

public class AppDbContext : IdentityDbContext<Usuario>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Categoria> Categorias { get; set; }
    public DbSet<Produto> Produtos { get; set; }
    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<Ambiente> Ambientes { get; set; }
    public DbSet<Reserva> Reservas { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        SeedUsuarioPadrao(builder);
        SeedCategoriaPadrao(builder);
        SeedProdutoPadrao(builder);
        SeedAmbientePadrao(builder);
    }

    private static void SeedUsuarioPadrao(ModelBuilder builder)
    {
        List<IdentityRole> roles =
        [
            new IdentityRole { Id = "0b44ca04-f6b0-4a8f-a953-1f2330d30894", Name = "Administrador", NormalizedName = "ADMINISTRADOR" },
            new IdentityRole { Id = "ddf093a6-6cb5-4ff7-9a64-83da34aee005", Name = "Cliente", NormalizedName = "CLIENTE" },
        ];
        builder.Entity<IdentityRole>().HasData(roles);

        List<Usuario> usuarios = [
            new Usuario {
                Id = "aab44ca0-f6b0-4a8f-a953-1f2330d30894",
                Email = "admin@barbina.com", NormalizedEmail = "ADMIN@BARBINA.COM",
                UserName = "admin@barbina.com", NormalizedUserName = "ADMIN@BARBINA.COM",
                LockoutEnabled = true, EmailConfirmed = true,
                Nome = "Administrador Barbina",
                DataNascimento = DateTime.Parse("01/01/1990"),
                Foto = "/img/usuarios/avatar.png"
            }
        ];
        foreach (var user in usuarios)
        {
            PasswordHasher<Usuario> pass = new();
            user.PasswordHash = pass.HashPassword(user, "Admin@123");
        }
        builder.Entity<Usuario>().HasData(usuarios);

        builder.Entity<IdentityUserRole<string>>().HasData(
            new IdentityUserRole<string> { UserId = "aab44ca0-f6b0-4a8f-a953-1f2330d30894", RoleId = "0b44ca04-f6b0-4a8f-a953-1f2330d30894" }
        );
    }

    // As 4 categorias abaixo são exatamente as usadas pela navegação do Cardápio do site.
    private static void SeedCategoriaPadrao(ModelBuilder builder)
    {
        builder.Entity<Categoria>().HasData(
            new Categoria { Id = 1, Nome = "Entradas", Cor = "rgba(255,140,0,1)" },
            new Categoria { Id = 2, Nome = "Pratos Principais", Cor = "rgba(220,53,69,1)" },
            new Categoria { Id = 3, Nome = "Bebidas", Cor = "rgba(23,162,184,1)" },
            new Categoria { Id = 4, Nome = "Sobremesas", Cor = "rgba(111,66,193,1)" }
        );
    }

    // Cardápio real do restaurante Barbina.
    private static void SeedProdutoPadrao(ModelBuilder builder)
    {
        builder.Entity<Produto>().HasData(
            // ---------- Entradas (CategoriaId = 1) ----------
            new Produto { Id = 1, CategoriaId = 1, Nome = "Funghi e Queijo Brie", Descricao = "Fatias de pão cobertas com creme de funghi e queijo brie gratinado.", Qtde = 50, ValorCusto = 0, ValorVenda = 0 },
            new Produto { Id = 2, CategoriaId = 1, Nome = "Carpaccio de Carne", Descricao = "Fatias finas de carne crua, cobertas com alcaparras, fio de azeite, queijo parmesão e molho especial de mostarda. Acompanha cesta de torradas.", Qtde = 50, ValorCusto = 0, ValorVenda = 0 },
            new Produto { Id = 3, CategoriaId = 1, Nome = "Ceviche de Salmão", Descricao = "Cubos de salmão cru marinados no limão, com cebola roxa, pimenta vermelha e temperos especiais.", Qtde = 50, ValorCusto = 0, ValorVenda = 0 },
            new Produto { Id = 4, CategoriaId = 1, Nome = "Tábua de Frios", Descricao = "Salame italiano, muçarela, gorgonzola, provolone, presunto, azeitonas pretas, tomate e cesta de pães.", Qtde = 50, ValorCusto = 0, ValorVenda = 0, Destaque = true },
            new Produto { Id = 5, CategoriaId = 1, Nome = "Batata Specialle", Descricao = "Porção de batatas fritas gratinadas com catupiry, muçarela e bacon.", Qtde = 50, ValorCusto = 0, ValorVenda = 0 },
            new Produto { Id = 6, CategoriaId = 1, Nome = "Camarão ao Alho", Descricao = "Saborosos camarões com casca, salteados na manteiga e alho.", Qtde = 50, ValorCusto = 0, ValorVenda = 0 },
            new Produto { Id = 7, CategoriaId = 1, Nome = "Tribom", Descricao = "Tiras de filé mignon com rúcula, calabresa acebolada, iscas de frango ao catupiry e alho.", Qtde = 50, ValorCusto = 0, ValorVenda = 0 },

            // ---------- Pratos Principais (CategoriaId = 2) ----------
            new Produto { Id = 8, CategoriaId = 2, Nome = "Picanha Barbina", Descricao = "Corte nobre de picanha servido com purê cremoso de mandioca, vinagrete, farofa, arroz branco e feijão.", Qtde = 50, ValorCusto = 0, ValorVenda = 0, Destaque = true },
            new Produto { Id = 9, CategoriaId = 2, Nome = "Imperial", Descricao = "Filés grelhados ao molho branco com palmito. Acompanha batatas sauté.", Qtde = 50, ValorCusto = 0, ValorVenda = 0 },
            new Produto { Id = 10, CategoriaId = 2, Nome = "Supremo", Descricao = "Filés grelhados cobertos com molho especial de champignon, catupiry, bacon e batata sorriso.", Qtde = 50, ValorCusto = 0, ValorVenda = 0 },
            new Produto { Id = 11, CategoriaId = 2, Nome = "Filé ao Molho Madeira", Descricao = "Filés grelhados ao molho madeira com champignon. Acompanha purê de batatas.", Qtde = 50, ValorCusto = 0, ValorVenda = 0 },
            new Produto { Id = 12, CategoriaId = 2, Nome = "Americano", Descricao = "Filé mignon grelhado com presunto, queijo e lascas de parmesão gratinado. Acompanha batatas fritas.", Qtde = 50, ValorCusto = 0, ValorVenda = 0 },
            new Produto { Id = 13, CategoriaId = 2, Nome = "Bistrô", Descricao = "Filé mignon salteado na manteiga com molho roti, servido com batatas recheadas com creme de queijo brie e crisp de presunto de Parma.", Qtde = 50, ValorCusto = 0, ValorVenda = 0 },
            new Produto { Id = 14, CategoriaId = 2, Nome = "À Poivre", Descricao = "Filé ao tradicional molho à base de creme de leite e pimentas verdes. Acompanha batatas sauté.", Qtde = 50, ValorCusto = 0, ValorVenda = 0 },

            // ---------- Bebidas (CategoriaId = 3) ----------
            new Produto { Id = 15, CategoriaId = 3, Nome = "Sex on the Beach", Descricao = "Vodca, licor de pêssego, suco de laranja e xarope de frutas vermelhas.", Qtde = 50, ValorCusto = 0, ValorVenda = 0 },
            new Produto { Id = 16, CategoriaId = 3, Nome = "Caipirinha Tropicana", Descricao = "Mexerica e limão preparados com saquê, pimenta-rosa ou manjericão.", Qtde = 50, ValorCusto = 0, ValorVenda = 0, Destaque = true },
            new Produto { Id = 17, CategoriaId = 3, Nome = "Soda Italiana", Descricao = "Água com gás e xarope de frutas.", Qtde = 50, ValorCusto = 0, ValorVenda = 0 },
            new Produto { Id = 18, CategoriaId = 3, Nome = "Negroni", Descricao = "Gin, vermute tinto, Campari e laranja.", Qtde = 50, ValorCusto = 0, ValorVenda = 0 },
            new Produto { Id = 19, CategoriaId = 3, Nome = "Whiskey Sour", Descricao = "Whiskey, suco de limão, xarope de açúcar e borda de sal.", Qtde = 50, ValorCusto = 0, ValorVenda = 0 },
            new Produto { Id = 20, CategoriaId = 3, Nome = "Chopp Claro", Descricao = "", Qtde = 50, ValorCusto = 0, ValorVenda = 0 },
            new Produto { Id = 21, CategoriaId = 3, Nome = "Dry Martini", Descricao = "Gin, vermute seco e azeitona.", Qtde = 50, ValorCusto = 0, ValorVenda = 0 },

            // ---------- Sobremesas (CategoriaId = 4) ----------
            new Produto { Id = 22, CategoriaId = 4, Nome = "Petit Gateau", Descricao = "Bolo de chocolate com interior cremoso, servido com calda de chocolate e sorvete.", Qtde = 50, ValorCusto = 0, ValorVenda = 0, Destaque = true },
            new Produto { Id = 23, CategoriaId = 4, Nome = "Petit Gateau de Doce de Leite", Descricao = "Bolo de doce de leite com interior cremoso, servido com calda de chocolate e sorvete.", Qtde = 50, ValorCusto = 0, ValorVenda = 0 },
            new Produto { Id = 24, CategoriaId = 4, Nome = "Crumble de Banana", Descricao = "Banana assada com doce de leite, coberta com farofa crocante de aveia e açúcar. Acompanha sorvete de creme.", Qtde = 50, ValorCusto = 0, ValorVenda = 0 },
            new Produto { Id = 25, CategoriaId = 4, Nome = "Bom Demais", Descricao = "Massinha de churros servida com doce de leite e Nutella.", Qtde = 50, ValorCusto = 0, ValorVenda = 0 },
            new Produto { Id = 26, CategoriaId = 4, Nome = "Brownie", Descricao = "Brownie de chocolate com nozes, coberto com calda de brigadeiro. Acompanha sorvete de creme.", Qtde = 50, ValorCusto = 0, ValorVenda = 0 },
            new Produto { Id = 27, CategoriaId = 4, Nome = "Brownie na Taça", Descricao = "Brownie de chocolate com nozes, servido em taça com doce de leite e calda de brigadeiro.", Qtde = 50, ValorCusto = 0, ValorVenda = 0 },
            new Produto { Id = 28, CategoriaId = 4, Nome = "Bola de Sorvete", Descricao = "Uma deliciosa bola de sorvete de creme.", Qtde = 50, ValorCusto = 0, ValorVenda = 0 }
        );
    }

    // 4 slides de carrossel + 4 imagens de galeria (uma por seção), replicando os
    // valores padrão que antes viviam fixos no JavaScript do site.
    private static void SeedAmbientePadrao(ModelBuilder builder)
    {
        builder.Entity<Ambiente>().HasData(
            // ---------- Carrossel (topo da página Ambientes) ----------
            new Ambiente {
                Id = 1, Titulo = "Salão Principal", Tag = "Elegância & Sofisticação",
                Descricao = "Amplo, iluminado e decorado com detalhes que remetem à tradição italiana. Perfeito para jantares especiais e momentos em família.",
                Foto = "/img/ambientes/6184fc42-4f25-44fe-ba5a-c1291a99854a.jpg",
                IsCarousel = true, CarouselOrder = 1
            },
            new Ambiente {
                Id = 2, Titulo = "Área de Balcão", Tag = "Descontração & Sabor",
                Descricao = "Espaço acolhedor para apreciar nossas caipirinhas e porções enquanto acompanha a movimentação da cozinha.",
                Foto = "/img/ambientes/c0d7b9cd-932d-4951-94fe-5057af6d702f.jpg",
                IsCarousel = true, CarouselOrder = 2
            },
            new Ambiente {
                Id = 3, Titulo = "Área ao Ar Livre", Tag = "Frescor & Tranquilidade",
                Descricao = "Ambiente ao ar livre, perfeito para celebrações especiais, reuniões de negócios ou momentos inesquecíveis com quem você ama.",
                Foto = "/img/ambientes/5f8b5a28-4f6b-4b5f-84b4-6224c4916fb2.jpg",
                IsCarousel = true, CarouselOrder = 3
            },
            new Ambiente {
                Id = 4, Titulo = "Espaço Kids", Tag = "Diversão & Conforto",
                Descricao = "Um espaço pensado para a diversão das crianças, com conforto e tranquilidade para toda a família.",
                Foto = "/img/ambientes/6dbcca96-73ca-4c5c-bdaf-9703862907ed.jpg",
                IsCarousel = true, CarouselOrder = 4
            },

            // ---------- Galeria de Ambientes (story-items) ----------
            new Ambiente {
                Id = 5, Titulo = "Salão Principal", Subtitulo = "Tradição & Conforto", Secao = "Salao Principal",
                Descricao = "Inspirado nos antigos salões italianos, este espaço foi projetado para receber famílias e amigos com todo aconchego. Os tons terrosos e a iluminação suave criam uma atmosfera perfeita para longas conversas e refeições memoráveis.",
                Foto = "/img/ambientes/1471ea77-b600-469b-bd01-c20e4b05cb59.jpg",
                IsCarousel = false, IsActive = true
            },
            new Ambiente {
                Id = 6, Titulo = "Área de Balcão", Subtitulo = "Encontros & Amigos", Secao = "Area de Balcao",
                Descricao = "O balcão é o coração pulsante do Barbina. É ali que as melhores histórias começam, acompanhadas de uma caipirinha gelada e porções generosas.",
                Foto = "/img/ambientes/1d0a4841-aa75-4b7b-ac75-ebbfa65f7487.jpg",
                IsCarousel = false, IsActive = true
            },
            new Ambiente {
                Id = 7, Titulo = "Área ao Ar Livre", Subtitulo = "Exclusividade & Celebração", Secao = "Área ao Ar Livre",
                Descricao = "Perfeita para aproveitar bons momentos em um ambiente aberto e agradável, nossa área ao ar livre acomoda até 20 pessoas e oferece atendimento personalizado para tornar sua experiência ainda mais especial.",
                Foto = "/img/ambientes/e229faf0-4faf-4cc5-b9f1-fe67400084a0.jpg",
                IsCarousel = false, IsActive = true
            },
            new Ambiente {
                Id = 8, Titulo = "Espaço Kids", Subtitulo = "Diversão & Alegria", Secao = "Espaço Kids",
                Descricao = "Um cantinho especial para as crianças brincarem com segurança e entretenimento, proporcionando mais tranquilidade e conforto para toda a família.",
                Foto = "/img/ambientes/0b0d1d26-7ea6-4d24-8bf9-6efc1b438312.jpg",
                IsCarousel = false, IsActive = true
            }
        );
    }
}
