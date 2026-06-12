FROM python:3.12-slim

RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

COPY --chown=user backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu \
    && pip install scipy

COPY --chown=user backend/ .
COPY --chown=user fasalguard_final_93pct/ fasalguard_final_93pct/

EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
