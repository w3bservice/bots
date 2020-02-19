import { inject, injectable } from 'inversify';

import { ICatchController } from '../interfaces/controllers';
import { CatchResult, Mention, User } from '../../interfaces';
import { ActionResult } from '../models/actionResult';
import { TYPES } from '../../ioc/types';
import { CatchService, MentionsService } from '../../services';
import { CatchMentions } from '../../models';
import { CatchHimselfError, NoCatchError, UnverifiedMentionsError } from '../errors';
import { CatchSummary } from '../interfaces/catch';
import { UsersStore } from '../interfaces/store';


@injectable()
export class CatchController implements ICatchController {
  constructor(
    @inject(TYPES.USERS_STORE) private usersStore: UsersStore,
    @inject(TYPES.CATCH_SERVICE) private catchService: CatchService,
    @inject(TYPES.MENTION_SERVICE) private mentionsService: MentionsService,
  ) { }

  approveCatch = async (chatId: number, catchId: string): Promise<ActionResult<CatchResult>> => {
    const catchResult: CatchResult = await this.catchService.approveCatch(chatId, catchId);

    return ActionResult.success(catchResult);
  };

  rejectCatch = async (chatId: number, catchId: string): Promise<ActionResult<CatchResult>> => {
    const catchResult: CatchResult = await this.catchService.rejectCatch(chatId, catchId);

    return ActionResult.success(catchResult);
  };

  registerVictimsCatch = async (chatId: number, hunterId: number, mentions: Mention[]): Promise<ActionResult<CatchSummary>> => {
    const catchMentions: CatchMentions = await this.mentionsService.getMentionedUsersData(chatId, mentions);

    const error: Error = this.verifyCatch(chatId, hunterId, catchMentions);
    if (error) {
      return new ActionResult(error);
    }

    const catchId: string = await this.catchService.addCatchRecord(chatId, hunterId, catchMentions.victims);

    const admin: User = await this.usersStore.getAdminFromChat(chatId);
    const catchSummary: CatchSummary = {
      admin,
      catchId,
      victims: catchMentions.victims,
      unverifiedMentions: catchMentions.unverifiedMentions,
    };

    return ActionResult.success(catchSummary);
  };

  private verifyCatch = (chatId: number, hunterId: number, catchMentions: CatchMentions): Error => {
    const errMessagePrefix = `[chatId: ${chatId}; hunterId: ${hunterId}]`;

    if (!catchMentions.hasAnyMentions) {
      return new NoCatchError(`${errMessagePrefix} catch doesn't have any mentions`);
    }

    if (catchMentions.hasUnverifiedMentions) {
      const stringifiedUnverifiedUsers: string = JSON.stringify(catchMentions.unverifiedMentions);
      const message = `${errMessagePrefix} catch have a few unverified users ${stringifiedUnverifiedUsers}`;

      return new UnverifiedMentionsError(message, catchMentions.unverifiedMentions);
    }

    const isCaptureHimself = catchMentions.victims.some((user: User) => user.id === hunterId);
    if (isCaptureHimself) {
      return new CatchHimselfError(`${errMessagePrefix} hunter has caught himself`);
    }

    return null;
  };
}
