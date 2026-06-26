namespace Barbina.API.Helpers;
public static class TranslateIdentityErrors
{
    public static string TranslateErrorMessage(string codeError) => codeError switch
    {
        "DuplicateUserName" => "Este login já está sendo utilizado.",
        "DuplicateEmail" => "Este email já está sendo utilizado.",
        "PasswordTooShort" => "Senha muito curta.",
        "PasswordMismatch" => "Senha incorreta.",
        _ => "Ocorreu um erro desconhecido."
    };
}
