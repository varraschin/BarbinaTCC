using Barbina.API.DTOs;
namespace Barbina.API.Services.Interfaces;
public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto);
    Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
    Task<UserDto> GetUserByIdAsync(string userId);
}
