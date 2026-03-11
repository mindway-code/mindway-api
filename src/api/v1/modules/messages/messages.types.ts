export type MessageRecord = {
  id: string;
  senderId: string;
  recipientId: string | null;
  socialNetworkId: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;

  sender: { id: string; name: string; email: string | null };
  recipient?: { id: string; name: string; email: string | null } | null;
  socialNetwork?: { id: string; name: string } | null;
};

export type CreateMessageDTO = {
  content: string;
};

export type CreateDirectMessageInput = {
  senderId: string;
  recipientId: string;
  content: string;
};

export type CreateSocialNetworkMessageInput = {
  senderId: string;
  socialNetworkId: string;
  content: string;
};

export type ListMessagesParams = {
  skip?: number;
  take?: number;
};

export type ListMessagesResult = {
  items: MessageRecord[];
  total: number;
};

export type ListMessagesResponse = {
  items: MessageRecord[];
  meta: { pagination: { page: number; pageSize: number; total: number; totalPages: number } };
};

export type DeleteMessageResult = { id: string };

