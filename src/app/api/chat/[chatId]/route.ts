import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { getMessagesByChatId, createMessage } from "@/lib/messageService";

interface ChatResponse {
  success: boolean;
  messages?: Array<{
    id: string;
    chatId: string;
    userId: string | null;
    content: string;
    type: string;
    createdAt: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
    } | null;
  }>;
  message?: {
    id: string;
    chatId: string;
    userId: string | null;
    content: string;
    type: string;
    createdAt: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
    } | null;
  };
  error?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
): Promise<NextResponse<ChatResponse>> {
  const { chatId } = await params;

  try {
    // Get messages for this chat
    const Messages = await getMessagesByChatId(chatId);
    console.log(Messages);

    if (Messages.length === 0) {
      return NextResponse.json({
        success: true,
        messages: [],
      });
    }

    return NextResponse.json({
      success: true,
      messages: Messages.map((message) => ({
        id: message.id,
        chatId: message.chatId,
        userId: message.userId,
        content: message.content,
        type: message.type,
        createdAt: message.createdAt.toISOString(),
        user: message.user,
      })),
    });
  } catch (_error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch messages",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
): Promise<NextResponse<ChatResponse>> {
  const { chatId } = await params;

  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, type } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Content is required",
        },
        { status: 400 }
      );
    }

    // Create new message
    const newMessage = await createMessage({
      chatId,
      userId: session.user.id,
      content: content.trim(),
      type: type || "TEXT",
    });

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage.id,
        chatId: newMessage.chatId,
        userId: newMessage.userId,
        content: newMessage.content,
        type: newMessage.type,
        createdAt: newMessage.createdAt.toISOString(),
        user: newMessage.user,
      },
    });
  } catch (_error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send message",
      },
      { status: 500 }
    );
  }
}
