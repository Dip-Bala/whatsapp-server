import { Schema } from 'mongoose';
declare const UserModel: import("mongoose").Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    createdAt: NativeDate;
    name?: string | null;
    profilePicUrl?: string | null;
    status?: string | null;
}, {}, {}, {}, import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    createdAt: NativeDate;
    name?: string | null;
    profilePicUrl?: string | null;
    status?: string | null;
}, {}, {
    timestamps: true;
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    createdAt: NativeDate;
    name?: string | null;
    profilePicUrl?: string | null;
    status?: string | null;
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
    email: string;
    createdAt: NativeDate;
    name?: string | null;
    profilePicUrl?: string | null;
    status?: string | null;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    createdAt: NativeDate;
    name?: string | null;
    profilePicUrl?: string | null;
    status?: string | null;
}>, {}, import("mongoose").ResolveSchemaOptions<{
    timestamps: true;
}>> & import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    createdAt: NativeDate;
    name?: string | null;
    profilePicUrl?: string | null;
    status?: string | null;
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
    status: string;
    sender: import("mongoose").Types.ObjectId;
    receiver: import("mongoose").Types.ObjectId;
    timestamp: NativeDate;
    text?: string | null;
}, {}, {}, {}, import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    type: "text" | "image" | "video" | "document" | "audio";
    status: string;
    sender: import("mongoose").Types.ObjectId;
    receiver: import("mongoose").Types.ObjectId;
    timestamp: NativeDate;
    text?: string | null;
}, {}, {
    timestamps: true;
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    type: "text" | "image" | "video" | "document" | "audio";
    status: string;
    sender: import("mongoose").Types.ObjectId;
    receiver: import("mongoose").Types.ObjectId;
    timestamp: NativeDate;
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
    status: string;
    sender: import("mongoose").Types.ObjectId;
    receiver: import("mongoose").Types.ObjectId;
    timestamp: NativeDate;
    text?: string | null;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    type: "text" | "image" | "video" | "document" | "audio";
    status: string;
    sender: import("mongoose").Types.ObjectId;
    receiver: import("mongoose").Types.ObjectId;
    timestamp: NativeDate;
    text?: string | null;
}>, {}, import("mongoose").ResolveSchemaOptions<{
    timestamps: true;
}>> & import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    type: "text" | "image" | "video" | "document" | "audio";
    status: string;
    sender: import("mongoose").Types.ObjectId;
    receiver: import("mongoose").Types.ObjectId;
    timestamp: NativeDate;
    text?: string | null;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>>;
declare const ContactModel: import("mongoose").Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    name: string;
    profilePicUrl: string;
    owner: import("mongoose").Types.ObjectId;
    isOnline: boolean;
    linkedUser: import("mongoose").Types.ObjectId;
    isOnWhatsApp: boolean;
    email?: string | null;
}, {}, {}, {}, import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    name: string;
    profilePicUrl: string;
    owner: import("mongoose").Types.ObjectId;
    isOnline: boolean;
    linkedUser: import("mongoose").Types.ObjectId;
    isOnWhatsApp: boolean;
    email?: string | null;
}, {}, {
    timestamps: true;
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    name: string;
    profilePicUrl: string;
    owner: import("mongoose").Types.ObjectId;
    isOnline: boolean;
    linkedUser: import("mongoose").Types.ObjectId;
    isOnWhatsApp: boolean;
    email?: string | null;
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
    name: string;
    profilePicUrl: string;
    owner: import("mongoose").Types.ObjectId;
    isOnline: boolean;
    linkedUser: import("mongoose").Types.ObjectId;
    isOnWhatsApp: boolean;
    email?: string | null;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    name: string;
    profilePicUrl: string;
    owner: import("mongoose").Types.ObjectId;
    isOnline: boolean;
    linkedUser: import("mongoose").Types.ObjectId;
    isOnWhatsApp: boolean;
    email?: string | null;
}>, {}, import("mongoose").ResolveSchemaOptions<{
    timestamps: true;
}>> & import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    name: string;
    profilePicUrl: string;
    owner: import("mongoose").Types.ObjectId;
    isOnline: boolean;
    linkedUser: import("mongoose").Types.ObjectId;
    isOnWhatsApp: boolean;
    email?: string | null;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>>;
declare const ChatModel: import("mongoose").Model<{
    participants: string[];
    unreadCount: any;
    lastMessage?: {
        text?: string | null;
        status?: string | null;
        timestamp?: NativeDate | null;
        senderEmail?: string | null;
    } | null;
}, {}, {}, {}, import("mongoose").Document<unknown, {}, {
    participants: string[];
    unreadCount: any;
    lastMessage?: {
        text?: string | null;
        status?: string | null;
        timestamp?: NativeDate | null;
        senderEmail?: string | null;
    } | null;
}, {}, import("mongoose").DefaultSchemaOptions> & {
    participants: string[];
    unreadCount: any;
    lastMessage?: {
        text?: string | null;
        status?: string | null;
        timestamp?: NativeDate | null;
        senderEmail?: string | null;
    } | null;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, {
    participants: string[];
    unreadCount: any;
    lastMessage?: {
        text?: string | null;
        status?: string | null;
        timestamp?: NativeDate | null;
        senderEmail?: string | null;
    } | null;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    participants: string[];
    unreadCount: any;
    lastMessage?: {
        text?: string | null;
        status?: string | null;
        timestamp?: NativeDate | null;
        senderEmail?: string | null;
    } | null;
}>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<{
    participants: string[];
    unreadCount: any;
    lastMessage?: {
        text?: string | null;
        status?: string | null;
        timestamp?: NativeDate | null;
        senderEmail?: string | null;
    } | null;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>>;
export { UserModel, ContactModel, MessageModel, ChatModel };
//# sourceMappingURL=schema.d.ts.map