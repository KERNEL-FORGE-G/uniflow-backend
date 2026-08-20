import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { Multer } from 'multer'; 


// 50 Mo en octets (50 * 1024 * 1024)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_FILE_SIZE, // LIMITE STRICTE DE 50 Mo
      },
      fileFilter: (req, file, cb) => {
        // (Optionnel) Filtrez ici par type MIME si vous voulez
        // Exemple : n'accepter que les images et PDF
        // if (!file.originalname.match(/\.(jpg|jpeg|png|gif|pdf)$/)) {
        //   return cb(new BadRequestException('Seuls les images et PDF sont acceptés.'), false);
        // }
        cb(null, true);
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileDto,
  ) {
    // Vérification de sécurité supplémentaire
    if (!file) {
      throw new BadRequestException('Aucun fichier n\'a été fourni.');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(`Le fichier dépasse la limite autorisée de 50 Mo.`);
    }

    // Appel du service que vous avez déjà écrit
    return this.filesService.uploadFile(
      file,
      uploadFileDto.entityType,
      uploadFileDto.entityId,
    );
  }

  // Bonus : Endpoint pour supprimer un fichier
  @Post('delete/:id')
  async deleteFile(@Body('id') id: string) {
    return this.filesService.deleteFile(id);
  }
}