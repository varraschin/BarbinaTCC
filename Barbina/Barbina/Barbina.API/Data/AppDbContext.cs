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

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        SeedUsuarioPadrao(builder);
        SeedCategoriaPadrao(builder);
        SeedProdutoPadrao(builder);
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

    private static void SeedCategoriaPadrao(ModelBuilder builder)
    {
        builder.Entity<Categoria>().HasData(
            new Categoria { Id = 1, Nome = "Entradas", Cor = "rgba(255,140,0,1)" },
            new Categoria { Id = 2, Nome = "Pratos Principais", Cor = "rgba(220,53,69,1)" },
            new Categoria { Id = 3, Nome = "Massas", Cor = "rgba(255,193,7,1)" },
            new Categoria { Id = 4, Nome = "Grelhados", Cor = "rgba(40,167,69,1)" },
            new Categoria { Id = 5, Nome = "Sobremesas", Cor = "rgba(111,66,193,1)" },
            new Categoria { Id = 6, Nome = "Bebidas", Cor = "rgba(23,162,184,1)" }
        );
    }

    private static void SeedProdutoPadrao(ModelBuilder builder)
    {
        builder.Entity<Produto>().HasData(
            new Produto { Id = 1, CategoriaId = 1, Nome = "Bruschetta Clássica", Descricao = "Fatias de pão italiano tostado com tomate, alho, azeite e manjericão fresco.", Qtde = 50, ValorCusto = 8.00m, ValorVenda = 24.90m, Destaque = true },
            new Produto { Id = 2, CategoriaId = 1, Nome = "Carpaccio de Filé", Descricao = "Finas fatias de filé mignon cru temperadas com azeite, limão, alcaparras e lascas de parmesão.", Qtde = 30, ValorCusto = 18.00m, ValorVenda = 49.90m, Destaque = false },
            new Produto { Id = 3, CategoriaId = 1, Nome = "Ostras Frescas", Descricao = "Meia dúzia de ostras frescas, servidas com limão siciliano e mignonette de vinagre de vinho tinto.", Qtde = 20, ValorCusto = 25.00m, ValorVenda = 55.00m, Destaque = false },
            new Produto { Id = 4, CategoriaId = 2, Nome = "Filé Mignon Barbina", Descricao = "Medalhão de 400g selado, com molho de vinho tinto reduzido e risoto cremoso de parmesão.", Qtde = 40, ValorCusto = 35.00m, ValorVenda = 89.90m, Destaque = true },
            new Produto { Id = 5, CategoriaId = 2, Nome = "Risotto de Cogumelos Trufados", Descricao = "Arroz arbóreo com um mix de cogumelos frescos, azeite trufado e finalizado com queijo Grana Padano.", Qtde = 35, ValorCusto = 22.00m, ValorVenda = 65.90m, Destaque = true },
            new Produto { Id = 6, CategoriaId = 2, Nome = "Salmão Grelhado com Purê", Descricao = "Filé de salmão grelhado com crosta de gergelim e purê aveludado de batata doce com gengibre.", Qtde = 25, ValorCusto = 30.00m, ValorVenda = 78.00m, Destaque = false },
            new Produto { Id = 7, CategoriaId = 3, Nome = "Tagliatelle ao Funghi", Descricao = "Massa fresca ao molho cremoso de funghi secchi com azeite e ervas finas.", Qtde = 45, ValorCusto = 15.00m, ValorVenda = 52.90m, Destaque = true },
            new Produto { Id = 8, CategoriaId = 3, Nome = "Linguine al Limone", Descricao = "Linguine com molho leve de limão siciliano, camarões grelhados e salsa.", Qtde = 40, ValorCusto = 22.00m, ValorVenda = 59.90m, Destaque = false },
            new Produto { Id = 9, CategoriaId = 4, Nome = "Costela Bovina Grelhada", Descricao = "Costela bovina maturada grelhada lentamente, servida com farofa artesanal e vinagrete.", Qtde = 20, ValorCusto = 35.00m, ValorVenda = 89.90m, Destaque = true },
            new Produto { Id = 10, CategoriaId = 5, Nome = "Brownie com Sorvete", Descricao = "Brownie quente de chocolate belga e nozes, servido com sorvete de baunilha e calda de caramelo salgado.", Qtde = 50, ValorCusto = 8.00m, ValorVenda = 26.90m, Destaque = true },
            new Produto { Id = 11, CategoriaId = 5, Nome = "Crème Brûlée", Descricao = "Clássica sobremesa francesa com casquinha de açúcar caramelizado.", Qtde = 45, ValorCusto = 7.00m, ValorVenda = 29.00m, Destaque = false },
            new Produto { Id = 12, CategoriaId = 6, Nome = "Caipirinha Barbina", Descricao = "Releitura da caipirinha com cachaça premium, limão taiti e toque de pimenta rosa.", Qtde = 100, ValorCusto = 6.00m, ValorVenda = 24.90m, Destaque = false },
            new Produto { Id = 13, CategoriaId = 6, Nome = "Vinho da Casa (Taça)", Descricao = "Seleção especial de vinho tinto ou branco para acompanhar seu prato.", Qtde = 80, ValorCusto = 8.00m, ValorVenda = 35.00m, Destaque = true }
        );
    }
}
