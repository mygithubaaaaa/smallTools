-- 腾讯会议快速加入工具
-- 支持从剪贴板读取会议号或手动输入

on run
    try
        -- 获取剪贴板内容
        set clipboardContent to (the clipboard as string)
        
        -- 尝试从剪贴板提取会议号
        set meetingID to extractMeetingID(clipboardContent)
        
        if meetingID is "" then
            -- 如果剪贴板没有会议号，提示用户输入
            set meetingID to text returned of (display dialog "请输入腾讯会议号:" default answer "" with title "腾讯会议快速加入")
        else
            -- 确认是否使用检测到的会议号
            set userChoice to button returned of (display dialog "检测到会议号: " & meetingID & return & return & "是否使用此会议号加入会议？" buttons {"取消", "重新输入", "确认"} default button "确认" with title "腾讯会议快速加入")
            
            if userChoice is "重新输入" then
                set meetingID to text returned of (display dialog "请输入腾讯会议号:" default answer meetingID with title "腾讯会议快速加入")
            else if userChoice is "取消" then
                return
            end if
        end if
        
        -- 清理会议号（移除空格、连字符等）
        set meetingID to cleanMeetingID(meetingID)
        
        if meetingID is "" then
            display dialog "会议号不能为空！" with title "错误" buttons {"确定"} default button "确定"
            return
        end if
        
        -- 构建腾讯会议 URL
        set meetingURL to "wemeet://page/inmeeting?meeting_code=" & meetingID
        
        -- 打开腾讯会议
        do shell script "open '" & meetingURL & "'"
        
        -- 显示成功消息
        display notification "正在加入会议: " & meetingID with title "腾讯会议" subtitle "会议号已复制并启动应用"
        
    on error errMsg
        display dialog "发生错误: " & errMsg with title "错误" buttons {"确定"} default button "确定"
    end try
end run

-- 提取会议号的函数
on extractMeetingID(inputText)
    try
        set meetingID to ""
        
        -- 常见的会议号格式模式
        set patterns to {"会议号[：:][[:space:]]*([0-9 -]+)", "会议ID[：:][[:space:]]*([0-9 -]+)", "Meeting ID[：:][[:space:]]*([0-9 -]+)", "([0-9]{3}[[:space:]-]*[0-9]{3}[[:space:]-]*[0-9]{3,4})", "([0-9]{9,11})"}
        
        repeat with pattern in patterns
            try
                set meetingID to do shell script "echo " & quoted form of inputText & " | grep -oE " & quoted form of pattern & " | head -1"
                if meetingID is not "" then
                    -- 清理提取的会议号
                    set meetingID to cleanMeetingID(meetingID)
                    if length of meetingID ≥ 9 then
                        return meetingID
                    end if
                end if
            end try
        end repeat
        
        -- 如果没有匹配到，尝试提取纯数字
        try
            set meetingID to do shell script "echo " & quoted form of inputText & " | grep -oE '[0-9]{9,11}' | head -1"
            if meetingID is not "" then
                return meetingID
            end if
        end try
        
        return ""
    on error
        return ""
    end try
end extractMeetingID

-- 清理会议号的函数
on cleanMeetingID(meetingID)
    try
        -- 移除所有非数字字符
        set cleanID to do shell script "echo " & quoted form of meetingID & " | sed 's/[^0-9]//g'"
        return cleanID
    on error
        return meetingID
    end try
end cleanMeetingID