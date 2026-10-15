from pydantic import BaseModel


class TelegramLinkResponse(BaseModel):
    token: str
    deep_link: str


class TelegramWebhookRequest(BaseModel):
    token: str
    chat_id: int
    username: str | None = None


class TelegramWebhookResponse(BaseModel):
    full_name: str

    model_config = {"from_attributes": True}
