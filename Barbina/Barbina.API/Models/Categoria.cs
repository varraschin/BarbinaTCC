using System.ComponentModel.DataAnnotations;

namespace Barbina.API.Models;

public class Categoria
{
    public int Id { get; set; }
    [Required][StringLength(50)] public string Nome { get; set; } = string.Empty;
    public string Foto { get; set; }
    [StringLength(26)] public string Cor { get; set; } = "rgba(0,0,0,1)";
    public ICollection<Produto> Produtos { get; set; }
}
