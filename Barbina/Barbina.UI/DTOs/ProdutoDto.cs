using System.Text.Json.Serialization;

namespace Barbina.UI.DTOs;

public class ProdutoDto
{
    [JsonPropertyName("id")] public int Id { get; set; }
    [JsonPropertyName("categoriaId")] public int CategoriaId { get; set; }
    [JsonPropertyName("nome")] public string Nome { get; set; } = string.Empty;
    [JsonPropertyName("descricao")] public string Descricao { get; set; } = string.Empty;
    [JsonPropertyName("qtde")] public int Qtde { get; set; }
    [JsonPropertyName("valorCusto")] public decimal ValorCusto { get; set; }
    [JsonPropertyName("valorVenda")] public decimal ValorVenda { get; set; }
    [JsonPropertyName("destaque")] public bool Destaque { get; set; }
    [JsonPropertyName("foto")] public string Foto { get; set; } = string.Empty;
    [JsonPropertyName("categoriaNome")] public string CategoriaNome { get; set; } = string.Empty;
}
