import { inject, injectable } from 'inversify';

import { AppContext } from '../../../shared/interfaces';
import { TYPES } from '../../types';

import { ActionResult } from '../../core/models/action-result';
import { NotInGameError } from '../../core/errors';
import { IUsersController } from '../../core/interfaces/controllers';

import { ActionHandler } from '../interfaces/action-handler';
import { TelegramReplyService } from '../services';


@injectable()
export class UpdateHandler implements ActionHandler {
  private replyService: TelegramReplyService;

  constructor(
    @inject(TYPES.USERS_CONTROLLER) private usersController: IUsersController,
  ) {}

  handleAction = async (ctx: AppContext): Promise<any> => {
    this.replyService = new TelegramReplyService(ctx);

    const { from, chat }: AppContext = ctx;

    const result: ActionResult = await this.usersController.updateUserDataInChat(chat.id, from.id, {
      username: from.username,
      firstName: from.first_name,
      lastName: from.last_name ?? null,
    });

    if (result.failed) {
      return this.handleUpdateError(result.error);
    }

    return this.replyService.showSuccessUpdate();
  };

  private handleUpdateError = (error: Error): Promise<void> => {
    if (error instanceof NotInGameError) {
      return this.replyService.showNotInGameError();
    }

    return this.replyService.showUnexpectedError();
  };
}