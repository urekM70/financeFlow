import contextvars
from typing import Any

# Default language is English
_lang: contextvars.ContextVar[str] = contextvars.ContextVar("lang", default="en")

def set_lang(lang: str) -> None:
    _lang.set(lang)

def get_lang() -> str:
    return _lang.get()

translations = {
    "en": {
        "Transaction deleted successfully": "Transaction deleted successfully",
        "No transactions found with the given IDs.": "No transactions found with the given IDs.",
        "Database connection is not available.": "Database connection is not available.",
        "Database not available": "Database not available",
        "Transaction not found": "Transaction not found",
        "No transaction IDs provided for deletion.": "No transaction IDs provided for deletion.",
        "Email already registered": "Email already registered",
        "Incorrect username or password": "Incorrect username or password",
        "Could not validate credentials": "Could not validate credentials",
        "Successfully deleted {count} transaction(s).": "Successfully deleted {count} transaction(s).",
    },
    "es": {
        "Transaction deleted successfully": "Transacción eliminada con éxito",
        "No transactions found with the given IDs.": "No se encontraron transacciones con los ID dados.",
        "Database connection is not available.": "La conexión a la base de datos no está disponible.",
        "Database not available": "Base de datos no disponible",
        "Transaction not found": "Transacción no encontrada",
        "No transaction IDs provided for deletion.": "No se proporcionaron ID de transacciones para su eliminación.",
        "Email already registered": "El correo electrónico ya está registrado",
        "Incorrect username or password": "Usuario o contraseña incorrectos",
        "Could not validate credentials": "No se pudieron validar las credenciales",
        "Successfully deleted {count} transaction(s).": "Se eliminaron {count} transaccion(es) con éxito.",
    },
    "fr": {
        "Transaction deleted successfully": "Transaction supprimée avec succès",
        "No transactions found with the given IDs.": "Aucune transaction trouvée avec les identifiants donnés.",
        "Database connection is not available.": "La connexion à la base de données n'est pas disponible.",
        "Database not available": "Base de données non disponible",
        "Transaction not found": "Transaction introuvable",
        "No transaction IDs provided for deletion.": "Aucun identifiant de transaction fourni pour la suppression.",
        "Email already registered": "Email déjà enregistré",
        "Incorrect username or password": "Nom d'utilisateur ou mot de passe incorrect",
        "Could not validate credentials": "Impossible de valider les informations d'identification",
        "Successfully deleted {count} transaction(s).": "{count} transaction(s) supprimée(s) avec succès.",
    }
}

def _(text: str, **kwargs: Any) -> str:
    lang = get_lang()
    # Fallback to English if translation is missing
    translated = translations.get(lang, translations["en"]).get(text, text)
    if kwargs:
        return translated.format(**kwargs)
    return translated
