import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 10000;

// 미들웨어
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// OpenAI 클라이언트
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Kakao 응답 포맷 helper
function makeSimpleText(text) {
  return {
    version: "2.0",
    template: {
      outputs: [
        {
          simpleText: {
            text,
          },
        },
      ],
    },
  };
}

// 헬스체크
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 카카오 스킬 엔드포인트
app.post("/kakao/fortune", async (req, res) => {
  try {
    const kakaoReq = req.body;
    const userMessage = kakaoReq?.userRequest?.utterance || "";

    console.log("[Kakao] User message:", userMessage);

    if (!userMessage.trim()) {
      return res.json(makeSimpleText("질문을 입력해 주세요 🙂"));
    }

    // OpenAI 호출 (응답 빨리 오도록 짧게)
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "당신은 한국어로 대답하는 친절한 운세 상담 무속인 챗봇입니다. " +
            "짧고 핵심적인 한 단락으로만 이야기해 주세요.",
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      max_completion_tokens: 200,
      temperature: 0.8,
    });

    const aiMessage =
      completion.choices?.[0]?.message?.content?.trim() ||
      "지금은 운세를 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.";

    console.log("[OpenAI] Response:", aiMessage);

    return res.json(makeSimpleText(aiMessage));
  } catch (err) {
    console.error("Error in /kakao/fortune:", err);
    return res.json(
      makeSimpleText(
        "일시적인 오류가 발생했어요. 잠시 후 다시 한 번만 시도해 주세요 🙏"
      )
    );
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
