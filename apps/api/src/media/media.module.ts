import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { MediaAccessService } from "./media-access.service";

@Module({
  imports: [PrismaModule],
  providers: [MediaAccessService],
  exports: [MediaAccessService],
})
export class MediaModule {}
