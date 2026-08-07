import logging
from contextlib import asynccontextmanager
from typing import List
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer

# Cấu hình Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ai-worker")

# Model configuration
MODEL_NAME = "all-MiniLM-L6-v2"
model_container = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Quản lý vòng đời ứng dụng FastAPI:
    Load trước model SentenceTransformer vào bộ nhớ (RAM/GPU) khi khởi động
    để tối ưu hóa tốc độ suy luận (inference) cho các request tiếp theo.
    """
    logger.info(f"Đang tải model SentenceTransformer: '{MODEL_NAME}'...")
    try:
        model_container["model"] = SentenceTransformer(MODEL_NAME)
        logger.info(f"Tải model '{MODEL_NAME}' thành công! Sẵn sàng nhận request.")
    except Exception as e:
        logger.error(f"Lỗi khi tải model '{MODEL_NAME}': {str(e)}")
        raise e
    yield
    logger.info("Đang giải phóng tài nguyên AI Worker...")
    model_container.clear()


app = FastAPI(
    title="Fashion E-Commerce AI Worker",
    version="1.0.0",
    description="Microservice tạo Text Embedding cho Smart Semantic Search",
    lifespan=lifespan
)

# Cấu hình CORS để cho phép Backend Express hoặc các client gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic Schemas
class EmbedRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        description="Đoạn văn bản cần chuyển đổi thành vector embedding (tên, mô tả sản phẩm hoặc câu truy vấn người dùng)",
        examples=["Áo sơ mi lụa trắng phong cách thanh lịch đi làm tiệc"]
    )


class EmbedResponse(BaseModel):
    success: bool = True
    embedding: List[float] = Field(
        ...,
        description="Mảng vector 384 chiều biểu diễn ngữ nghĩa của văn bản"
    )
    dimensions: int = Field(
        default=384,
        description="Số chiều của vector embedding (all-MiniLM-L6-v2 là 384)"
    )


@app.get("/health", tags=["System"])
@app.get("/ai/v1/health", tags=["System"])
async def health_check():
    """Kiểm tra trạng thái hoạt động của AI Worker & model"""
    is_ready = "model" in model_container and model_container["model"] is not None
    return {
        "status": "healthy" if is_ready else "initializing",
        "model_loaded": is_ready,
        "model_name": MODEL_NAME,
        "dimension": 384
    }


@app.post(
    "/ai/v1/embed",
    response_model=EmbedResponse,
    status_code=status.HTTP_200_OK,
    tags=["Embedding"],
    summary="Sinh vector embedding 384 chiều từ text"
)
async def generate_embedding(payload: EmbedRequest):
    """
    API nhận văn bản (search query hoặc thông tin sản phẩm)
    và trả về mảng vector embedding 384 chiều bằng model all-MiniLM-L6-v2.
    """
    raw_text = payload.text.strip()
    if not raw_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Văn bản không được để trống hoặc chỉ chứa khoảng trắng."
        )

    model = model_container.get("model")
    if model is None:
        logger.error("Model chưa được khởi tạo trong bộ nhớ!")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Model chưa sẵn sàng, vui lòng thử lại sau."
        )

    try:
        # Chuẩn hóa embeddings (normalize_embeddings=True) để tối ưu tính toán Cosine Similarity
        embedding = model.encode(raw_text, normalize_embeddings=True)
        embedding_list = embedding.tolist()

        return EmbedResponse(
            success=True,
            embedding=embedding_list,
            dimensions=len(embedding_list)
        )
    except Exception as e:
        logger.error(f"Lỗi khi sinh embedding cho text '{raw_text[:50]}...': {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi xử lý sinh vector: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    # Khởi chạy server uvicorn ở cổng 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
