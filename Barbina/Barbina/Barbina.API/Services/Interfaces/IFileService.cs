namespace Barbina.API.Services.Interfaces;

public interface IFileService
{
    Task<string> SaveFileAsync(IFormFile file, string subDirectory = "uploads");
    Task<bool> DeleteFileAsync(string filePath);
    string GetFileUrl(string fileName);
}
