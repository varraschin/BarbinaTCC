using Barbina.UI.DTOs;
using Barbina.UI.ViewModels;

namespace Barbina.UI.Services.Interfaces;

public interface IAuthUiService
{
    Task<AuthResponseDto> LoginAsync(LoginViewModel loginViewModel);
}
