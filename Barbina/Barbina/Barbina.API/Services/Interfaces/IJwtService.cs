using Barbina.API.DTOs;
namespace Barbina.API.Services.Interfaces;
public interface IJwtService { string GenerateToken(UserDto user); }
