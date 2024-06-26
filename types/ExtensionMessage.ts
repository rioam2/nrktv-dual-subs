export type ExtensionMessagePayload<T extends ExtensionMessageAction> = T extends ExtensionMessageAction.Translate
  ? { text: string; source_lang: string; target_lang: string }
  : never;

export enum ExtensionMessageAction {
  Translate = 'translate'
}

export type ExtensionMessage = {
  action: ExtensionMessageAction.Translate;
  payload: ExtensionMessagePayload<ExtensionMessageAction.Translate>;
};

export type ExtensionReply<T extends ExtensionMessageAction> = T extends ExtensionMessageAction.Translate
  ?
      | {
          error: Error;
          response: null;
        }
      | {
          error: null;
          response: string;
        }
  : never;
