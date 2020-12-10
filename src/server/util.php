<?php
    function curl($name, $curlOpts)
    {
        $start_time = microtime(true);
        try 
        {
            $ch = curl_init();
            $defOpts = array(
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_HEADER => true);
            curl_setopt_array($ch, $defOpts);
            curl_setopt_array($ch, $curlOpts);
            
            error_log(curl_getinfo($ch, CURLINFO_EFFECTIVE_URL));
            
            $response = curl_exec($ch);
            
            $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
            $body = substr($response, $headerSize);
            $data = json_decode($body, true);
        } catch (Exception $e)
        {
            error_log($e->getMessage(), 0);
        }

        return $data;
    }

    function getIni()
    {
        return parse_ini_file(SCRIPTS_ROOT . "map.ini", true);
    }

    function replaceIni($props = [])
    {
        $res = [];
        foreach ($props as $pK => $pV)
        {
            if (is_array($pV))
            {
                $res[] = "[$pK]";
                foreach ($pV as $iK => $iV)
                {
                    $res[] = "$iK = ".(is_numeric($iV) ? $iV : '"'.$iV.'"');
                }
            }
            else
            {
                $res[] = "$pK = ".(is_numeric($pV) ? $pV : '"'.$pV.'"');
            }
        }
        error_log(print_r($res, true));
        safeWrite(SCRIPTS_ROOT . "map.ini", implode("\r\n", $res));
    }

    function safeWrite($file = "", $data)
    {
        if ($fp = fopen($file, "w"))
        {
            $startTime = microtime(true);
            do
            {
                $canWrite = flock($fp, LOCK_EX);
                if(!$canWrite)
                {
                    usleep(round(rand(0, 100)*1000));
                }
            } while ((!$canWrite) && ((microtime(true) - $startTime) < 5));
            
            if ($canWrite)
            {
                fwrite($fp, $data);
                flock($fp, LOCK_UN);
            }
            fclose($fp);
        }
    }
?>