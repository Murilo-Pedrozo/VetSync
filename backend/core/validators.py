def cpf_valido(cpf: str) -> bool:
    """Valida CPF com 11 números pelos dígitos verificadores."""
    if len(cpf) != 11 or not cpf.isdigit() or cpf == cpf[0] * 11:
        return False
    for i in (9, 10):
        soma = sum(int(cpf[n]) * (i + 1 - n) for n in range(i))
        if (soma * 10 % 11) % 10 != int(cpf[i]):
            return False
    return True