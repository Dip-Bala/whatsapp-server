import { Schema } from 'mongoose';
declare const UserModel: import("mongoose").Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    wa_id: string;
    createdAt: NativeDate;
    name?: string | null;
    phoneNumber?: string | null;
    profilePicUrl?: string | null;
}, {}, {}, {}, import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    wa_id: string;
    createdAt: NativeDate;
    name?: string | null;
    phoneNumber?: string | null;
    profilePicUrl?: string | null;
}, {}, {
    timestamps: true;
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    wa_id: string;
    createdAt: NativeDate;
    name?: string | null;
    phoneNumber?: string | null;
    profilePicUrl?: string | null;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    wa_id: string;
    createdAt: NativeDate;
    name?: string | null;
    phoneNumber?: string | null;
    profilePicUrl?: string | null;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    wa_id: string;
    createdAt: NativeDate;
    name?: string | null;
    phoneNumber?: string | null;
    profilePicUrl?: string | null;
}>, {}, import("mongoose").ResolveSchemaOptions<{
    timestamps: true;
}>> & import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    wa_id: string;
    createdAt: NativeDate;
    name?: string | null;
    phoneNumber?: string | null;
    profilePicUrl?: string | null;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>>;
declare const MessageModel: import("mongoose").Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    type: "text" | "image" | "video" | "document" | "audio";
    waMessageId: string;
    sender: import("mongoose").Types.ObjectId;
    receiver: import("mongoose").Types.ObjectId;
    timestamp: NativeDate;
    status: string;
    text?: string | null;
}, {}, {}, {}, import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    type: "text" | "image" | "video" | "document" | "audio";
    waMessageId: string;
    sender: import("mongoose").Types.ObjectId;
    receiver: import("mongoose").Types.ObjectId;
    timestamp: NativeDate;
    status: string;
    text?: string | null;
}, {}, {
    timestamps: true;
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    type: "text" | "image" | "video" | "document" | "audio";
    waMessageId: string;
    sender: import("mongoose").Types.ObjectId;
    receiver: import("mongoose").Types.ObjectId;
    timestamp: NativeDate;
    status: string;
    text?: string | null;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    type: "text" | "image" | "video" | "document" | "audio";
    waMessageId: string;
    sender: import("mongoose").Types.ObjectId;
    receiver: import("mongoose").Types.ObjectId;
    timestamp: NativeDate;
    status: string;
    text?: string | null;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    type: "text" | "image" | "video" | "document" | "audio";
    waMessageId: string;
    sender: import("mongoose").Types.ObjectId;
    receiver: import("mongoose").Types.ObjectId;
    timestamp: NativeDate;
    status: string;
    text?: string | null;
}>, {}, import("mongoose").ResolveSchemaOptions<{
    timestamps: true;
}>> & import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    type: "text" | "image" | "video" | "document" | "audio";
    waMessageId: string;
    sender: import("mongoose").Types.ObjectId;
    receiver: import("mongoose").Types.ObjectId;
    timestamp: NativeDate;
    status: string;
    text?: string | null;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>>;
export { UserModel, MessageModel };
//# sourceMappingURL=schema.d.ts.map