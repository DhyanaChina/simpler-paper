import { checkTheme, findSource, assignConfig } from '../utils/check'
import { compileCatalog, compileMarkdown, copyTheme, copyInlineHtml, copyAssets } from '../compile'
import File from '../utils/file'
import Log from '../utils/log'
import Filter from '../utils/filter'
import { resolve } from 'path'

const removeDir = async(dir) => {
  await File.exists(dir) && await File.exec(`rm -rf ${dir}`)
}

;(async() => {
  const root = Filter.path(`${__dirname}/../..`)
  const templateTargetPath = `${root}/templates/target`
  const templateTempPath = `${root}/templates/temp`
  
  // check path
  Log.time.start('check config')
  const source: string = await findSource(process.cwd())
  const config: Config = await assignConfig(source)
  Log.time.over()
  
  
  // make catalog and html fragment
  const targetPath = `${resolve()}/${config.output}`
  const catalogs: Catalog[] = await compileCatalog(config)
  await compileMarkdown(catalogs, source)
  
  
  Log.time.start('generative assets')
  // reset target dir
  await removeDir(templateTargetPath)
  // await File.mkdir(templateTargetPath) // windows cp error

  // copy themes to target
  await checkTheme(config)
  await copyTheme(config)
  await copyAssets(config)
  Log.time.over()
  
  // copy cache to target, clear cache dir
  await File.exec(`cp -r ${templateTempPath}/ ${templateTargetPath}`)
  await removeDir(templateTempPath)

  // copy run time script and make index.html
  await copyInlineHtml(config, catalogs)
  
  
  // output to user dir
  Log.time.start('clear up')
  await removeDir(targetPath)
  await File.exec(`cp -R ${templateTargetPath}/ ${targetPath}/`)
  Log.time.over()
})()

